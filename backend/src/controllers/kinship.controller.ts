import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { KinshipService } from '../services/kinship.service';

export const calculateKinship = async (req: AuthRequest, res: Response) => {
  try {
    const { treeId, personAId, personBId } = req.query;

    if (!treeId || !personAId || !personBId) {
      return res.status(400).json({ error: 'Cần có treeId, personAId và personBId.' });
    }

    const [personA, personB, allPersons, allRels] = await Promise.all([
      prisma.person.findUnique({ where: { id: String(personAId) } }),
      prisma.person.findUnique({ where: { id: String(personBId) } }),
      prisma.person.findMany({ where: { treeId: String(treeId) } }),
      prisma.relationship.findMany({ where: { treeId: String(treeId) } }),
    ]);

    if (!personA || !personB) {
      return res.status(404).json({ error: 'Không tìm thấy một trong hai thành viên.' });
    }

    const result = KinshipService.calculateKinship(personA, personB, allPersons, allRels);
    return res.json(result);
  } catch (error) {
    console.error('Lỗi tính toán vai vế xưng hô:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tính toán xưng hô.' });
  }
};
