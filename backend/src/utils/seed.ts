import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('--- Đang khởi tạo dữ liệu mẫu Gia phả Việt Nam ---');

  // Xóa dữ liệu cũ nếu có
  await prisma.relationship.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.familyTree.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPasswordHash = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@famlykin.vn',
      passwordHash: adminPasswordHash,
      fullName: 'Quản Trị Viên Famlykin',
      role: 'ADMIN',
    },
  });

  const tree = await prisma.familyTree.create({
    data: {
      name: 'Gia phả Dòng họ Nguyễn (Đại Tôn - Chi Trưởng)',
      description: 'Cây gia phả số dòng họ Nguyễn lưu truyền từ Cụ Thủy Tổ Nguyễn Phúc Lộc',
      branchName: 'Chi Trưởng - Đệ Nhất Ngành',
      ancestorInfo: 'Khởi nguồn từ đất Cổ Am, định cư và phát triển tại Ý Yên, Nam Định và Hà Nội',
      ownerId: adminUser.id,
    },
  });

  // Đời 1
  const cuLoc = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Phúc Lộc',
      nickname: 'Cụ Tổ Phúc Lộc (Đại Lão Gia)',
      gender: 'MALE',
      generation: 1,
      isDeceased: true,
      birthDate: new Date('1915-02-15'),
      deathDate: new Date('1985-08-20'),
      lunarDeathDay: '15/07 Âm lịch (Rằm tháng Bảy)',
      burialPlace: 'Nghĩa trang Dòng họ, xã Yên Khánh, Ý Yên, Nam Định',
      burialCoordinates: '20.3521, 105.9815',
      biography: 'Thủy tổ chi phái, cả đời thanh bạch, yêu nước thương dân, có công đức xây dựng từ đường.',
    },
  });

  const cuSen = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Trần Thị Sen',
      nickname: 'Cụ Bà Phúc Sen',
      gender: 'FEMALE',
      generation: 1,
      isDeceased: true,
      birthDate: new Date('1918-05-10'),
      deathDate: new Date('1992-04-12'),
      lunarDeathDay: '03/03 Âm lịch (Tết Hàn Thực)',
      burialPlace: 'Nghĩa trang Dòng họ, Ý Yên, Nam Định',
      burialCoordinates: '20.3521, 105.9815',
      biography: 'Đức bà hiền hậu mẫu mực, dạy dỗ cháu con đạo hiếu và nếp nhà.',
    },
  });

  // Vợ chồng Cụ Lộc & Cụ Sen
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'SPOUSE', spouse1Id: cuLoc.id, spouse2Id: cuSen.id },
  });

  // Đời 2: Bác Dũng, Bố Thành, Cô Lan
  const bacDung = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Phúc Dũng',
      nickname: 'Bác Cả Dũng',
      gender: 'MALE',
      generation: 2,
      isDeceased: true,
      birthDate: new Date('1940-03-12'),
      deathDate: new Date('2015-12-05'),
      lunarDeathDay: '24/10 Âm lịch',
      burialPlace: 'Nghĩa trang Mai Dịch, Hà Nội',
      burialCoordinates: '21.0392, 105.7725',
      biography: 'Trưởng nam của dòng họ, cựu chiến binh thời kháng chiến chống Mỹ.',
    },
  });

  const bacThoa = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Lê Thị Thoa',
      nickname: 'Bác Gái Thoa',
      gender: 'FEMALE',
      generation: 2,
      isDeceased: false,
      birthDate: new Date('1945-08-20'),
      phone: '0903112233',
      address: 'Quận Ba Đình, Hà Nội',
    },
  });

  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'SPOUSE', spouse1Id: bacDung.id, spouse2Id: bacThoa.id },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: cuLoc.id, childId: bacDung.id },
  });

  const boThanh = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Phúc Thành',
      nickname: 'Ông Thành (Bố)',
      gender: 'MALE',
      generation: 2,
      isDeceased: false,
      birthDate: new Date('1948-10-15'),
      phone: '0912345678',
      address: 'Số 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
      biography: 'Cán bộ hưu trí ngành bưu chính viễn thông, am hiểu gia phả và phong tục truyền thống.',
    },
  });

  const meMai = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Hoàng Thị Mai',
      nickname: 'Bà Mai (Mẹ)',
      gender: 'FEMALE',
      generation: 2,
      isDeceased: false,
      birthDate: new Date('1952-04-18'),
      phone: '0913987654',
      address: 'Số 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    },
  });

  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'SPOUSE', spouse1Id: boThanh.id, spouse2Id: meMai.id },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: cuLoc.id, childId: boThanh.id },
  });

  const coLan = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Thị Lan',
      nickname: 'Cô Ba Lan (Nội)',
      gender: 'FEMALE',
      generation: 2,
      isDeceased: false,
      birthDate: new Date('1955-09-02'),
      phone: '0936789123',
      address: 'Đường Lạch Tray, Quận Ngô Quyền, Hải Phòng',
    },
  });

  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: cuLoc.id, childId: coLan.id },
  });

  // ==========================================
  // NHÁNH BÊN NGOẠI (Ông Bà Ngoại của An)
  // ==========================================
  const cuDuc = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Hoàng Văn Đức',
      nickname: 'Cụ Ông Ngoại',
      gender: 'MALE',
      generation: 1,
      isDeceased: true,
      birthDate: new Date('1919-04-10'),
      deathDate: new Date('1995-11-15'),
      lunarDeathDay: '23/09 Âm lịch',
      burialPlace: 'Nghĩa trang Dòng họ Hoàng, Vụ Bản, Nam Định',
      burialCoordinates: '20.3811, 106.1205',
      biography: 'Thủy tổ chi phái bên ngoại, tinh thông chữ Nho và y thuật cổ truyền.',
    },
  });

  const cuNhai = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Vũ Thị Nhài',
      nickname: 'Cụ Bà Ngoại',
      gender: 'FEMALE',
      generation: 1,
      isDeceased: true,
      birthDate: new Date('1922-08-15'),
      deathDate: new Date('2003-05-20'),
      lunarDeathDay: '20/04 Âm lịch',
      burialPlace: 'Nghĩa trang Dòng họ Hoàng, Vụ Bản, Nam Định',
      burialCoordinates: '20.3811, 106.1205',
      biography: 'Đức bà hiền thục phúc hậu, trọn đời hy sinh vì con cháu đôi bên nội ngoại.',
    },
  });

  // Hôn phối Cụ Đức ⚭ Cụ Nhài (Ông Bà Ngoại)
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'SPOUSE', spouse1Id: cuDuc.id, spouse2Id: cuNhai.id },
  });

  // Cụ Đức & Cụ Nhài sinh ra Mẹ Hoàng Thị Mai
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: cuDuc.id, childId: meMai.id },
  });

  // Cậu ruột bên ngoại: Hoàng Văn Tuấn (Em trai Mẹ Mai)
  const cauTuan = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Hoàng Văn Tuấn',
      nickname: 'Cậu Tuấn (Bên ngoại)',
      gender: 'MALE',
      generation: 2,
      isDeceased: false,
      birthDate: new Date('1958-12-05'),
      phone: '0915667788',
      address: 'Đường Trần Hưng Đạo, TP. Nam Định',
      biography: 'Kỹ sư cơ khí, hiện công tác và định cư tại Nam Định.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: cuDuc.id, childId: cauTuan.id },
  });

  // Đời 3: Nguyễn Văn An (Tôi), Vợ: Hà, Em gái: Chi, Anh họ: Tuấn
  const anhTuan = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Phúc Tuấn',
      nickname: 'Anh Tuấn',
      gender: 'MALE',
      generation: 3,
      isDeceased: false,
      birthDate: new Date('1972-06-15'),
      phone: '0988112233',
      address: 'Khu Đô Thị Ciputra, Tây Hồ, Hà Nội',
      biography: 'Doanh nhân, giám đốc công ty thương mại xuất nhập khẩu.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: bacDung.id, childId: anhTuan.id },
  });

  const toiAn = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Văn An',
      nickname: 'An (Admin)',
      gender: 'MALE',
      generation: 3,
      isDeceased: false,
      birthDate: new Date('1978-11-20'),
      phone: '0987654321',
      address: 'Chung cư Golden Park, Cầu Giấy, Hà Nội',
      biography: 'Người khởi xướng xây dựng ứng dụng Cây Gia Phả Số kết nối con cháu dòng tộc.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: boThanh.id, childId: toiAn.id },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: meMai.id, childId: toiAn.id },
  });

  const voHa = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Vũ Thu Hà',
      nickname: 'Hà (Vợ)',
      gender: 'FEMALE',
      generation: 3,
      isDeceased: false,
      birthDate: new Date('1982-01-14'),
      phone: '0987112244',
      address: 'Cầu Giấy, Hà Nội',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'SPOUSE', spouse1Id: toiAn.id, spouse2Id: voHa.id },
  });

  const emChi = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Mai Chi',
      nickname: 'Chi (Em gái)',
      gender: 'FEMALE',
      generation: 3,
      isDeceased: false,
      birthDate: new Date('1985-07-28'),
      phone: '0912778899',
      address: 'Quận Đống Đa, Hà Nội',
      biography: 'Giảng viên khoa Ngôn ngữ học, trường ĐHQG Hà Nội.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: boThanh.id, childId: emChi.id },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: meMai.id, childId: emChi.id },
  });

  // Đời 4: Con của An & Hà
  const conMinh = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Phúc Minh',
      nickname: 'Minh (Con trai)',
      gender: 'MALE',
      generation: 4,
      isDeceased: false,
      birthDate: new Date('2006-09-10'),
      phone: '0977223344',
      address: 'Hà Nội',
      biography: 'Sinh viên năm thứ 2 Đại học Bách Khoa Hà Nội.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: toiAn.id, childId: conMinh.id },
  });

  const conDan = await prisma.person.create({
    data: {
      treeId: tree.id,
      fullName: 'Nguyễn Linh Đan',
      nickname: 'Bé Đan (Con gái)',
      gender: 'FEMALE',
      generation: 4,
      isDeceased: false,
      birthDate: new Date('2012-12-25'),
      address: 'Hà Nội',
      biography: 'Học sinh lớp 9 trường THCS Giảng Võ.',
    },
  });
  await prisma.relationship.create({
    data: { treeId: tree.id, type: 'PARENT_CHILD', parentId: toiAn.id, childId: conDan.id },
  });

  console.log('✓ Khởi tạo dữ liệu quản trị viên hoàn tất thành công!');
  console.log('  Tài khoản Admin (ADMIN): admin@famlykin.vn / 123456');
  console.log(`  Cây gia phả ban đầu: "${tree.name}" (ID: ${tree.id})`);
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('seed')) {
  seedDatabase()
    .catch((e) => {
      console.error('Lỗi khi nạp seed data:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
