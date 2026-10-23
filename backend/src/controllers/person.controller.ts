import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { storageService } from '../services/storage.service';

export const createPerson = async (req: AuthRequest, res: Response) => {
  try {
    const {
      treeId,
      fullName,
      nickname,
      gender,
      phone,
      address,
      generation,
      birthDate,
      isDeceased,
      deathDate,
      lunarDeathDay,
      burialPlace,
      burialCoordinates,
      avatarUrl,
      biography,
      parentId,
      childId,
      spouseId,
      siblingId,
    } = req.body;

    if (!treeId || !fullName) {
      return res.status(400).json({ error: 'Cần có treeId và họ tên thành viên.' });
    }

    // 1. Khởi tạo thành viên
    let finalGeneration = Number(generation) || 1;

    // Nếu thêm Cha/Mẹ cho một người ở đời 1, kiểm tra trùng lặp và tự động dịch chuyển toàn bộ cây xuống 1 bậc
    if (childId) {
      const existingParentRels = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', childId },
        include: { parent: true },
      });

      if (existingParentRels.length >= 2) {
        return res.status(400).json({
          error: 'Thành viên này đã có đủ 2 Cha/Mẹ trong gia phả. Không thể tạo thêm để tránh trùng lặp vai trò.',
        });
      }

      const incomingGender = gender || 'MALE';
      const existingFather = existingParentRels.find((r) => r.parent?.gender === 'MALE');
      const existingMother = existingParentRels.find((r) => r.parent?.gender === 'FEMALE');

      if (existingFather && incomingGender === 'MALE') {
        return res.status(400).json({
          error: `Thành viên này đã có Bố là "${existingFather.parent?.fullName}". Không thể tạo thêm Bố để tránh trùng lặp.`,
        });
      }

      if (existingMother && incomingGender === 'FEMALE') {
        return res.status(400).json({
          error: `Thành viên này đã có Mẹ là "${existingMother.parent?.fullName}". Không thể tạo thêm Mẹ để tránh trùng lặp.`,
        });
      }

      const targetChild = await prisma.person.findUnique({ where: { id: childId } });
      if (targetChild) {
        if (targetChild.generation <= 1) {
          await prisma.person.updateMany({
            where: { treeId },
            data: { generation: { increment: 1 } },
          });
          finalGeneration = 1;
        } else {
          finalGeneration = targetChild.generation - 1;
        }
      }
    } else if (spouseId) {
      const existingSpouses = await prisma.relationship.findMany({
        where: {
          treeId,
          type: 'SPOUSE',
          OR: [{ spouse1Id: spouseId }, { spouse2Id: spouseId }],
        },
      });
      if (existingSpouses.length > 0) {
        return res.status(400).json({
          error: 'Thành viên này đã có Bạn đời trong gia phả. Không thể tạo thêm Bạn đời để tránh trùng lặp.',
        });
      }
      const targetSpouse = await prisma.person.findUnique({ where: { id: spouseId } });
      if (targetSpouse) {
        finalGeneration = targetSpouse.generation;
      }
    } else if (siblingId) {
      const targetSibling = await prisma.person.findUnique({ where: { id: siblingId } });
      if (targetSibling) {
        finalGeneration = targetSibling.generation;
      }
    }

    const person = await prisma.person.create({
      data: {
        treeId,
        fullName,
        nickname,
        gender: gender || 'MALE',
        phone,
        address,
        generation: finalGeneration,
        birthDate: birthDate ? new Date(birthDate) : null,
        isDeceased: Boolean(isDeceased),
        deathDate: deathDate ? new Date(deathDate) : null,
        lunarDeathDay,
        burialPlace,
        burialCoordinates,
        avatarUrl,
        biography,
      },
    });

    // 2. Tự động tạo liên kết quan hệ 2 chiều đối xứng

    // Khi người mới là CON của parentId
    if (parentId) {
      await prisma.relationship.create({
        data: {
          treeId,
          type: 'PARENT_CHILD',
          parentId,
          childId: person.id,
        },
      });

      // Nếu parentId đã có bạn đời (vợ/chồng), tự động gắn con với bạn đời đó
      const parentSpouses = await prisma.relationship.findMany({
        where: {
          treeId,
          type: 'SPOUSE',
          OR: [{ spouse1Id: parentId }, { spouse2Id: parentId }],
        },
      });
      for (const sp of parentSpouses) {
        const otherParentId = sp.spouse1Id === parentId ? sp.spouse2Id : sp.spouse1Id;
        if (otherParentId) {
          const existingLink = await prisma.relationship.findFirst({
            where: { treeId, type: 'PARENT_CHILD', parentId: otherParentId, childId: person.id },
          });
          if (!existingLink) {
            await prisma.relationship.create({
              data: {
                treeId,
                type: 'PARENT_CHILD',
                parentId: otherParentId,
                childId: person.id,
              },
            });
          }
        }
      }
    }

    // Khi người mới là CHA/MẸ của childId
    if (childId) {
      await prisma.relationship.create({
        data: {
          treeId,
          type: 'PARENT_CHILD',
          parentId: person.id,
          childId,
        },
      });

      // Nếu con đã có cha/mẹ khác trong cây, tự động liên kết thành vợ chồng
      const otherParents = await prisma.relationship.findMany({
        where: {
          treeId,
          type: 'PARENT_CHILD',
          childId,
          parentId: { not: person.id },
        },
      });
      for (const op of otherParents) {
        if (op.parentId) {
          const existingSpouse = await prisma.relationship.findFirst({
            where: {
              treeId,
              type: 'SPOUSE',
              OR: [
                { spouse1Id: person.id, spouse2Id: op.parentId },
                { spouse1Id: op.parentId, spouse2Id: person.id },
              ],
            },
          });
          if (!existingSpouse) {
            await prisma.relationship.create({
              data: {
                treeId,
                type: 'SPOUSE',
                spouse1Id: op.parentId,
                spouse2Id: person.id,
              },
            });
          }
        }
      }
    }

    // Khi người mới là BẠN ĐỜI của spouseId
    if (spouseId) {
      await prisma.relationship.create({
        data: {
          treeId,
          type: 'SPOUSE',
          spouse1Id: spouseId,
          spouse2Id: person.id,
        },
      });

      // Tự động gắn người bạn đời mới làm Cha/Mẹ của tất cả các con hiện có của spouseId
      const spouseChildren = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', parentId: spouseId },
      });
      for (const sc of spouseChildren) {
        if (sc.childId) {
          const exists = await prisma.relationship.findFirst({
            where: { treeId, type: 'PARENT_CHILD', parentId: person.id, childId: sc.childId },
          });
          if (!exists) {
            await prisma.relationship.create({
              data: { treeId, type: 'PARENT_CHILD', parentId: person.id, childId: sc.childId },
            });
          }
        }
      }
    }

    // Khi người mới là ANH / CHỊ / EM của siblingId
    if (siblingId) {
      // 1. Kế thừa cha mẹ từ anh/chị/em
      const siblingParents = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', childId: siblingId },
      });
      for (const sp of siblingParents) {
        if (sp.parentId) {
          await prisma.relationship.create({
            data: {
              treeId,
              type: 'PARENT_CHILD',
              parentId: sp.parentId,
              childId: person.id,
            },
          });
        }
      }

      // 2. Lưu liên kết trực tiếp SIBLING
      await prisma.relationship.create({
        data: {
          treeId,
          type: 'SIBLING',
          spouse1Id: siblingId,
          spouse2Id: person.id,
        },
      });
    }

    return res.status(201).json(person);
  } catch (error) {
    console.error('Lỗi thêm thành viên:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi thêm thành viên.' });
  }
};

export const updatePerson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      nickname,
      gender,
      phone,
      address,
      generation,
      birthDate,
      isDeceased,
      deathDate,
      lunarDeathDay,
      burialPlace,
      burialCoordinates,
      avatarUrl,
      biography,
    } = req.body;

    const person = await prisma.person.update({
      where: { id },
      data: {
        fullName,
        nickname,
        gender,
        phone,
        address,
        generation: generation !== undefined ? Number(generation) : undefined,
        birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
        isDeceased: isDeceased !== undefined ? Boolean(isDeceased) : undefined,
        deathDate: deathDate !== undefined ? (deathDate ? new Date(deathDate) : null) : undefined,
        lunarDeathDay,
        burialPlace,
        burialCoordinates,
        avatarUrl,
        biography,
      },
    });

    return res.json(person);
  } catch (error) {
    console.error('Lỗi cập nhật thành viên:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật.' });
  }
};

export const deletePerson = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Xóa tất cả quan hệ liên quan
    await prisma.relationship.deleteMany({
      where: {
        OR: [
          { parentId: id },
          { childId: id },
          { spouse1Id: id },
          { spouse2Id: id },
        ],
      },
    });

    await prisma.person.delete({ where: { id } });
    return res.json({ message: 'Đã xóa thành viên thành công.' });
  } catch (error) {
    console.error('Lỗi xóa thành viên:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa.' });
  }
};

export const uploadAvatarHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file ảnh tải lên.' });
    }

    const fileUrl = await storageService.saveFile(req.file);
    return res.json({ avatarUrl: fileUrl });
  } catch (error) {
    console.error('Lỗi upload ảnh đại diện:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi upload ảnh.' });
  }
};

export const createRelationship = async (req: AuthRequest, res: Response) => {
  try {
    const { treeId, type, parentId, childId, spouse1Id, spouse2Id } = req.body;

    if (!treeId || !type) {
      return res.status(400).json({ error: 'Cần có treeId và loại quan hệ (type).' });
    }

    if (type === 'PARENT_CHILD' && childId) {
      const existingParentRels = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', childId },
        include: { parent: true },
      });

      if (existingParentRels.length >= 2) {
        return res.status(400).json({
          error: 'Thành viên này đã có đủ 2 Cha/Mẹ trong gia phả. Không thể gán thêm quan hệ Cha/Mẹ.',
        });
      }

      if (parentId) {
        const parentPerson = await prisma.person.findUnique({ where: { id: parentId } });
        if (parentPerson) {
          const sameGender = existingParentRels.find((r) => r.parent?.gender === parentPerson.gender);
          if (sameGender) {
            const role = parentPerson.gender === 'MALE' ? 'Bố' : 'Mẹ';
            return res.status(400).json({
              error: `Thành viên này đã có ${role} là "${sameGender.parent?.fullName}". Không thể gán thêm ${role}.`,
            });
          }
        }

        const existing = await prisma.relationship.findFirst({
          where: { treeId, type: 'PARENT_CHILD', parentId, childId },
        });
        if (existing) {
          return res.status(400).json({ error: 'Mối quan hệ Cha/Mẹ - Con này đã tồn tại trong gia phả.' });
        }
      }
    }

    if (type === 'SPOUSE' && spouse1Id && spouse2Id) {
      const existing = await prisma.relationship.findMany({
        where: {
          treeId,
          type: 'SPOUSE',
          OR: [
            { spouse1Id },
            { spouse2Id: spouse1Id },
            { spouse1Id: spouse2Id },
            { spouse2Id },
          ],
        },
      });
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Một trong hai thành viên đã có Bạn đời trong gia phả. Không thể tạo thêm mối quan hệ bạn đời để tránh trùng lặp.' });
      }
    }

    const rel = await prisma.relationship.create({
      data: {
        treeId,
        type,
        parentId,
        childId,
        spouse1Id,
        spouse2Id,
      },
    });

    // Nếu vừa tạo quan hệ SPOUSE, tự động đồng bộ con cái giữa 2 người bạn đời
    if (type === 'SPOUSE' && spouse1Id && spouse2Id) {
      const s1Children = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', parentId: spouse1Id },
      });
      for (const sc of s1Children) {
        if (sc.childId) {
          const exists = await prisma.relationship.findFirst({
            where: { treeId, type: 'PARENT_CHILD', parentId: spouse2Id, childId: sc.childId },
          });
          if (!exists) {
            await prisma.relationship.create({
              data: { treeId, type: 'PARENT_CHILD', parentId: spouse2Id, childId: sc.childId },
            });
          }
        }
      }

      const s2Children = await prisma.relationship.findMany({
        where: { treeId, type: 'PARENT_CHILD', parentId: spouse2Id },
      });
      for (const sc of s2Children) {
        if (sc.childId) {
          const exists = await prisma.relationship.findFirst({
            where: { treeId, type: 'PARENT_CHILD', parentId: spouse1Id, childId: sc.childId },
          });
          if (!exists) {
            await prisma.relationship.create({
              data: { treeId, type: 'PARENT_CHILD', parentId: spouse1Id, childId: sc.childId },
            });
          }
        }
      }
    }

    return res.status(201).json(rel);
  } catch (error) {
    console.error('Lỗi tạo quan hệ:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo quan hệ.' });
  }
};

export const deleteRelationship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.relationship.delete({ where: { id } });
    return res.json({ message: 'Đã xóa mối quan hệ thành công.' });
  } catch (error) {
    console.error('Lỗi xóa quan hệ:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ.' });
  }
};
