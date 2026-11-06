# Đánh giá UI/UX Famlykin

> Cập nhật lần cuối: 2026-11-06 — xác nhận hoàn tất các khuyến nghị chính và bổ sung keyboard navigation cho trang Điều khoản & Chính sách.

## Phạm vi kiểm tra

- URL: `http://localhost:8088/`
- Desktop: `1440 x 900`
- Mobile: `390 x 844`
- Kiểm tra trực tiếp bằng browser trên trang local.
- Phạm vi: landing page, responsive layout, mobile menu, cookie banner, scroll behavior, animation, accessibility cơ bản và lỗi console.

## Tổng kết

| Hạng mục | Điểm đánh giá | Nhận xét |
|---|---:|---|
| Desktop UI | 8/10 | Hình ảnh thương hiệu rõ, bố cục tốt, CTA nổi bật |
| Mobile UI | 7.5/10 | Responsive tốt, không bị tràn ngang, menu dễ hiểu |
| Accessibility | 8.5/10 | Có reduced-motion, focus ring, semantic tabs và keyboard navigation |
| Runtime/performance | 7/10 | WebSocket proxy đã bổ sung; preload không phù hợp đã được loại bỏ |
| Animation | 7/10 | Có fade-in khi load, parallax và drawer animation; còn thiếu reveal theo section |

## Điểm tốt

### Desktop

- Header có cấu trúc rõ ràng: logo, điều hướng, nút đăng nhập.
- Hero section có tiêu đề, mô tả và CTA nổi bật.
- Màu xanh neon trên nền tối tạo nhận diện thương hiệu tốt.
- Layout không bị tràn ngang ở viewport `1440px`.
- Cookie banner có đủ các lựa chọn: tùy chỉnh, chỉ cookie cần thiết và đồng ý.

### Mobile

- Layout tự co giãn tốt ở viewport `390px`.
- Không phát hiện horizontal overflow.
- Hamburger menu có `aria-label` và animation chuyển đổi icon.
- CTA được chuyển thành dạng full-width, phù hợp thao tác cảm ứng.
- Nội dung các section được xếp theo chiều dọc dễ theo dõi.

### Animation

Trang hiện có:

- Fade-in toàn landing page khi load.
- Parallax nhẹ cho ảnh hero.
- Fade-out background hero khi scroll.
- Animation mở mobile drawer.
- Animation cho cookie banner.
- Transition hover cho CTA, navbar và card.

### Mobile navbar và nút hamburger

Đã kiểm tra riêng ở viewport `390 x 844`:

- Nút hamburger có kích thước khoảng `40 x 40px`, đủ dùng trên màn hình cảm ứng.
- Có `aria-label` thay đổi giữa `Mở menu` và `Đóng menu`.
- Hai thanh ngang chuyển thành biểu tượng X bằng `rotate` và `translate`.
- Drawer mobile trượt xuống trong khoảng `0.28s`.
- Khi mở menu, body và landing scroll wrapper được khóa cuộn, tránh cuộn nền phía sau.
- Khi scroll, header chuyển sang nền tối, blur và shadow; trạng thái này giúp navbar dễ đọc hơn trên ảnh hero.

Các điểm đã xử lý:

- Drawer đã dùng khoảng cách trên cố định thay cho `my-auto`, có animation đóng và stagger entrance.
- Hamburger đã có phản hồi nhấn `active:scale-95` và focus ring.
- Reduced-motion đã được áp dụng cho drawer, parallax, scroll và animation liên quan.

**Đánh giá hamburger/mobile navbar:** `8.5/10`.

**Trạng thái cập nhật:** Header đã dùng transition chuyên biệt cho `background-color`, `border-color`, `box-shadow` và `backdrop-filter` thay cho `transition-all`. Logo landing page đã là semantic button với `aria-label` và focus ring.

## Lịch sử vấn đề và trạng thái xử lý

## Ưu tiên cao

### 1. WebSocket handshake bị lỗi

**File liên quan:** [frontend/src/services/websocket.ts](frontend/src/services/websocket.ts)

Browser ghi nhận:

```text
WebSocket connection to 'ws://localhost:8088/ws' failed:
Error during WebSocket handshake: Unexpected response code: 200
```

Frontend đang kết nối đến `/ws`, nhưng server trả về HTTP `200` thay vì WebSocket handshake. Điều này có thể làm tính năng cập nhật cây gia phả theo thời gian thực không hoạt động.

**Trạng thái:** Đã xử lý trong [frontend/nginx.conf](frontend/nginx.conf) với HTTP/1.1 upgrade headers và timeout dài cho kết nối realtime.

- Kiểm tra cấu hình proxy `/ws` trong Vite hoặc Nginx.
- Đảm bảo request Upgrade được chuyển tiếp đến backend WebSocket.
- Kiểm tra backend WebSocket đang chạy cùng port hoặc được route đúng.
- Thêm trạng thái fallback rõ ràng nếu realtime không kết nối được.

## Ưu tiên trung bình

### 2. `prefers-reduced-motion`

**File liên quan:**

- [frontend/src/components/LandingPage.tsx](frontend/src/components/LandingPage.tsx)
- [frontend/src/styles/minimal.css](frontend/src/styles/minimal.css)

Trang có fade-in, parallax, drawer animation và nhiều transition; hiện đã có rule tôn trọng thiết lập giảm chuyển động của hệ điều hành.

**Trạng thái:** Đã xử lý trong [frontend/src/styles/minimal.css](frontend/src/styles/minimal.css) và [frontend/src/components/LandingPage.tsx](frontend/src/components/LandingPage.tsx). Parallax và smooth scroll được tắt khi hệ điều hành yêu cầu giảm chuyển động.

- Thêm media query `@media (prefers-reduced-motion: reduce)`.
- Tắt hoặc giảm parallax.
- Giảm animation load xuống opacity transition ngắn.
- Giữ nguyên trạng thái chức năng, chỉ giảm chuyển động thị giác.

### 3. Focus state cho keyboard

**File liên quan:** [frontend/src/components/LandingPage.tsx](frontend/src/components/LandingPage.tsx)

Nút hamburger mobile dùng `focus:outline-none` nhưng không có focus ring thay thế. Người dùng điều hướng bằng bàn phím khó nhận biết phần tử hiện tại.

**Trạng thái:** Đã xử lý cho landing page và trang legal bằng `focus-visible:ring-2`, focus offset phù hợp và phản hồi nhấn.

Dùng focus state rõ ràng, ví dụ:

```text
focus-visible:ring-2
focus-visible:ring-[#68ef3f]
focus-visible:ring-offset-2
```

Không nên tắt outline nếu không cung cấp chỉ báo focus thay thế.

### 4. Cookie banner trên mobile

**File liên quan:** [frontend/src/components/CookieConsentBanner.tsx](frontend/src/components/CookieConsentBanner.tsx)

Ở viewport `390 x 844`, cookie banner chiếm khoảng một phần tư đến một phần ba màn hình. Banner vẫn dùng được nhưng che nhiều nội dung hero và preview cây.

**Trạng thái:** Đã xử lý bằng cách giảm padding, kích thước icon, font và ẩn link chi tiết trên mobile; cần kiểm tra thêm với cỡ chữ hệ thống lớn.

- Giảm nội dung hiển thị mặc định trên mobile.
- Đưa nội dung chi tiết vào drawer hoặc modal khi người dùng chọn “Tùy Chỉnh”.
- Giữ ba hành động chính nhưng tối ưu lại kích thước và khoảng cách.
- Đảm bảo banner không che CTA quan trọng nếu có thể.

### 5. Preload asset không khớp asset đang sử dụng

Browser cảnh báo:

```text
The resource http://localhost:8088/images/hero-bg.webp was preloaded
but not used within a few seconds from the window's load event.
```

Trong [frontend/src/components/LandingPage.tsx](frontend/src/components/LandingPage.tsx), hero đang import `hero-bg1.webp`, trong khi preload lại trỏ đến `hero-bg.webp`.

**Trạng thái:** Đã xử lý bằng cách loại bỏ preload asset public không trùng với asset đã được Vite hash từ import. Cần kiểm tra lại warning sau khi deploy bản build mới.

### 6. Mobile drawer căn menu quá thấp

**File liên quan:** [frontend/src/components/LandingPage.tsx](frontend/src/components/LandingPage.tsx)

Khi bấm nút hai gạch ở góc phải, drawer mở đúng chức năng nhưng nhóm ba nút menu được căn bằng `my-auto`. Ở màn hình cao khoảng `844px`, cách này tạo khoảng trống lớn dưới header và đẩy menu xuống giữa màn hình.

**Trạng thái:** Đã xử lý bằng khoảng cách trên cố định, exit animation và stagger entrance.

- Đổi `my-auto` thành `mt-4` hoặc một khoảng cách responsive cố định.
- Giữ nhóm menu gần header để người dùng hiểu đây là navigation của navbar.
- Có thể dùng stagger animation nhẹ từng nút, nhưng không nên dùng animation để che vấn đề căn layout.

**Nếu bỏ qua:** Menu vẫn hoạt động nhưng cảm giác mở navbar thiếu cân bằng, người dùng phải nhìn xuống giữa màn hình để tìm điều hướng.

## Cải thiện thêm

### 7. Animation load còn đơn giản

Hiện animation chính của landing page là fade-in toàn trang trong khoảng `0.65s`. Đây là mức an toàn và không gây rối, nhưng chưa tạo cảm giác dẫn dắt người dùng qua từng khu vực.

**Trạng thái:** Không còn là blocker. Reveal animation theo section vẫn là tùy chọn và không ưu tiên hơn accessibility/performance.

- Thêm reveal nhẹ cho section khi đi vào viewport.
- Dùng stagger nhỏ cho các feature card.
- Thêm entrance animation riêng cho mobile navbar và hamburger feedback.
- Bổ sung exit animation khi đóng mobile drawer.
- Không nên animate mọi thành phần cùng lúc.
- Tôn trọng `prefers-reduced-motion`.

## Kiểm tra responsive

| Kiểm tra | Kết quả |
|---|---|
| Desktop `1440px` | Đạt |
| Mobile `390px` | Đạt |
| Horizontal overflow | Không phát hiện |
| Mobile hamburger menu | Có |
| Hamburger đổi sang X | Có |
| Animation mở mobile drawer | Có |
| Animation đóng mobile drawer | Có |
| Menu drawer nằm gần header | Đạt |
| Navbar animation khi load | Chỉ có fade-in toàn trang |
| Navbar state khi scroll | Có background/blur/shadow |
| Mobile CTA full-width | Có |
| Desktop navigation | Có |
| Cookie banner responsive | Có, nhưng hơi cao trên mobile |
| Scroll container riêng | Có |

Landing page dùng `.landing-guest-wrapper` làm scroll container riêng. Vì vậy cần tiếp tục kiểm tra các thư viện hoặc logic chỉ lắng nghe `window.scroll`, vì `window.scrollY` vẫn có thể bằng `0` trong khi nội dung thực tế đang scroll trong wrapper.

## Đánh giá bổ sung: trang Điều khoản & Chính sách

URL đã kiểm tra: `http://localhost:8088/terms-and-policies?tab=PRIVACY`  
Route cũ `/terms&policies?tab=PRIVACY` vẫn được giữ để tương thích.

### Kết quả kiểm tra trực tiếp

| Hạng mục | Desktop | Mobile |
|---|---|---|
| Hierarchy header/hero/content | Đạt | Đạt |
| Đồng bộ kích thước layout | Đạt, max-width thống nhất | Đạt, co một cột |
| Horizontal overflow | Không phát hiện | Không phát hiện ở `390px` |
| Sidebar/tab navigation | Đạt, sticky từ `lg` | Đạt, chuyển thành nhóm nút dọc |
| Đọc nội dung pháp lý | Tốt, article rộng và thoáng | Đọc được nhưng chữ/nội dung dày khi viewport hẹp |
| Cookie banner | Không ảnh hưởng cấu trúc chính | Đã tối ưu nội dung/padding; vẫn nên kiểm tra lại với mọi cỡ chữ hệ thống |

### Nhận xét UI và phong cách

- Phong cách dark green/neon green được đồng bộ tốt với landing page: nền `#070e09`, card `#0b160f`, viền `#273f2b`, CTA `#68ef3f`.
- Tỷ lệ layout hiện hợp lý: container `max-w-7xl`, sidebar khoảng 1/4 và article khoảng 3/4 ở desktop; mobile chuyển một cột đúng hướng.
- Hero đang hơi lớn trên desktop nhưng vẫn cân đối; không cần đổi toàn bộ visual style. Nên giữ cùng spacing, radius và màu sắc để trang pháp lý là một phần của cùng sản phẩm.
- Trên mobile, khoảng cách và cỡ chữ của văn bản pháp lý cần ưu tiên khả năng đọc hơn việc thu nhỏ quá nhiều. Mục tiêu nên là body tối thiểu khoảng `14–16px`, line-height khoảng `1.5–1.7`, và vùng chạm tối thiểu `44px`; các nút hiện tại đã được thu gọn để banner vừa viewport hẹp.

### Vấn đề cần cải thiện

1. **[Đã xử lý] Keyboard accessibility cho trang legal**
   - Tab đã có `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`; panel có `role="tabpanel"` và `aria-labelledby`.
   - Tab, nút “Quay lại” và logo đã có focus ring; logo đã chuyển sang semantic button.

2. **[Đã xử lý] Nút “Quay lại” bị lặp mũi tên**
   - Đã giữ icon SVG và chỉ còn nhãn `Quay lại`.

3. **[Đã xử lý] Cookie banner trên mobile**
   - Đã giảm padding/kích thước và rút gọn nội dung hiển thị trên viewport hẹp.

4. **[Đã xử lý] URL route**
   - `/terms-and-policies` là canonical route; `/terms&policies` và các alias cũ vẫn được hỗ trợ tương thích.

### Đánh giá best practices

Trang đã đạt các best practice nền tảng về responsive layout, visual consistency, readable content container, sticky navigation desktop, semantic accessibility cơ bản và canonical URL. Cookie banner đã được tối ưu cho mobile. Nên kiểm tra thêm với zoom/cỡ chữ hệ thống lớn và screen reader thực tế trước khi coi trang legal là production-ready tuyệt đối.

## Kết luận

Giao diện hiện tại có nền tảng tốt và các khuyến nghị chính trong review đã được xử lý. Trang Điều khoản & Chính sách đạt tốt về layout, semantic accessibility, keyboard navigation và route canonical. Chỉ còn kiểm tra xác nhận cuối với zoom/cỡ chữ lớn, screen reader và image Docker sau lần build triển khai.

**Thứ tự đề xuất:**

1. Kiểm tra screen reader và zoom/cỡ chữ lớn trên trang legal.
2. Xác nhận Docker image đang chạy đúng build mới nhất.
3. Cân nhắc thêm reveal animation theo section nếu cần; không ưu tiên hơn accessibility.
