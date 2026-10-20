FROM node:22-alpine AS builder

WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép schema prisma và generate prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Sao chép mã nguồn và build TypeScript
COPY . .
RUN npm run build

# Stage 2: Runtime Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="postgresql://familytree:familytree_pass_2026@postgres:5432/familytree_db?schema=public"
ENV STORAGE_TYPE=local

# Cài đặt thư viện cần thiết
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Tạo thư mục uploads
RUN mkdir -p /app/uploads

EXPOSE 5000

# Khởi tạo schema nếu chưa có và chạy server
CMD ["sh", "-c", "npx prisma db push && npm run start"]
