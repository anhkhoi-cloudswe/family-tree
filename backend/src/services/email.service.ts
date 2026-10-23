let currentWorkerEnv: any = null;

export const setWorkerEnv = (env: any) => {
  currentWorkerEnv = env;
};

export const getWorkerEnv = () => currentWorkerEnv;

interface SendEmailParams {
  to: string;
  fullName?: string;
  subject: string;
  html: string;
  actionUrl: string;
}

export const sendEmailThroughCloudflare = async ({
  to,
  fullName = '',
  subject,
  html,
  actionUrl,
}: SendEmailParams): Promise<{ success: boolean; method: string }> => {
  const env = getWorkerEnv();

  // Cloudflare Observability Log Output
  console.log(`\n======================================================`);
  console.log(`[CLOUDFLARE EMAIL SERVICE]`);
  console.log(`To: ${to} (${fullName || 'User'})`);
  console.log(`Subject: ${subject}`);
  console.log(`Action URL: ${actionUrl}`);
  console.log(`======================================================\n`);

  // 1. Try Native Cloudflare Email Service (env.EMAIL) if available
  if (env && env.EMAIL && typeof env.EMAIL.send === 'function') {
    try {
      await env.EMAIL.send({
        from: 'Famlykin <no-reply@famlykin.pages.dev>',
        to,
        subject,
        html,
      });
      console.log(`[Cloudflare Email] Successfully dispatched via env.EMAIL to ${to}`);
      return { success: true, method: 'cloudflare_native' };
    } catch (err: any) {
      console.warn(`[Cloudflare Email] env.EMAIL send failed:`, err.message);
    }
  }

  // 2. Try Resend API if API Key is present in environment
  const resendKey = process.env.RESEND_API_KEY || env?.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Famlykin <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });
      if (res.ok) {
        console.log(`[Cloudflare Email] Successfully dispatched via Resend API to ${to}`);
        return { success: true, method: 'resend_api' };
      }
      const resText = await res.text();
      console.warn(`[Cloudflare Email] Resend API error: ${res.status} - ${resText}`);
    } catch (err: any) {
      console.warn(`[Cloudflare Email] Resend fetch failed:`, err.message);
    }
  }

  // 3. Try MailChannels Transactional API (Designed specifically for Cloudflare Workers)
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to, name: fullName || to }],
          },
        ],
        from: {
          email: 'no-reply@famlykin.pages.dev',
          name: 'Famlykin - Cây Gia Phả',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (res.ok || res.status === 202) {
      console.log(`[Cloudflare Email] Successfully dispatched via MailChannels to ${to}`);
      return { success: true, method: 'mailchannels' };
    }
    const errText = await res.text();
    console.warn(`[Cloudflare Email] MailChannels responded with ${res.status}: ${errText}`);
  } catch (err: any) {
    console.warn(`[Cloudflare Email] MailChannels fetch failed:`, err.message);
  }

  return { success: true, method: 'logged_to_observability' };
};

/**
 * Gửi email xác nhận đăng ký tài khoản mới (Chỉ tạo tài khoản sau khi người dùng nhấp liên kết)
 */
export const sendSignupVerificationEmail = async (
  to: string,
  fullName: string,
  actionUrl: string
) => {
  const subject = '[Famlykin] Xác nhận tạo tài khoản cây gia phả';
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận tạo tài khoản Famlykin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #03150b; color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 520px; margin: 0 auto; background: #072213; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 16px; padding: 32px 28px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .brand { font-size: 24px; font-weight: 800; color: #34d399; margin-bottom: 20px; letter-spacing: -0.02em; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
        .desc { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 28px; text-align: left; }
        .btn-wrapper { margin-bottom: 28px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 18px rgba(16, 185, 129, 0.45); }
        .link-text { word-break: break-all; font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
        .footer { font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">🌿 Famlykin</div>
        <div class="title">Xác Nhận Tạo Tài Khoản</div>
        <div class="desc">
          Kính chào <strong>${fullName || 'Quý thành viên'}</strong>,<br><br>
          Bạn đã yêu cầu khởi tạo tài khoản trên nền tảng quản trị và kết nối gia phả số <strong>Famlykin</strong>.<br><br>
          Vui lòng bấm vào nút bên dưới để xác nhận email và hoàn tất việc tạo tài khoản của bạn:
        </div>
        <div class="btn-wrapper">
          <a href="${actionUrl}" target="_blank" class="btn">Xác Nhận Tạo Tài Khoản</a>
        </div>
        <div class="link-text">
          Nếu nút trên không hoạt động, vui lòng sao chép liên kết này vào trình duyệt:<br>
          <a href="${actionUrl}" style="color: #34d399;">${actionUrl}</a>
        </div>
        <div class="footer">
          Liên kết có hiệu lực trong vòng 24 giờ.<br>
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này. Tài khoản sẽ <strong>không được khởi tạo</strong> trên hệ thống.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailThroughCloudflare({
    to,
    fullName,
    subject,
    html,
    actionUrl,
  });
};

/**
 * Gửi email khôi phục / đặt lại mật khẩu
 */
export const sendPasswordResetEmail = async (
  to: string,
  fullName: string,
  actionUrl: string
) => {
  const subject = '[Famlykin] Đặt lại mật khẩu tài khoản';
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu Famlykin</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #03150b; color: #f1f5f9; padding: 24px; margin: 0; }
        .card { max-width: 520px; margin: 0 auto; background: #072213; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 16px; padding: 32px 28px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .brand { font-size: 24px; font-weight: 800; color: #34d399; margin-bottom: 20px; letter-spacing: -0.02em; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px; }
        .desc { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 28px; text-align: left; }
        .btn-wrapper { margin-bottom: 28px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 18px rgba(56, 189, 248, 0.45); }
        .link-text { word-break: break-all; font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
        .footer { font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 18px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">🌿 Famlykin</div>
        <div class="title">Đặt Lại Mật Khẩu Tài Khoản</div>
        <div class="desc">
          Kính chào <strong>${fullName || 'Quý thành viên'}</strong>,<br><br>
          Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản Famlykin liên kết với email <strong>${to}</strong>.<br><br>
          Vui lòng bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:
        </div>
        <div class="btn-wrapper">
          <a href="${actionUrl}" target="_blank" class="btn">Đặt Lại Mật Khẩu</a>
        </div>
        <div class="link-text">
          Hoặc mở liên kết sau trong trình duyệt:<br>
          <a href="${actionUrl}" style="color: #38bdf8;">${actionUrl}</a>
        </div>
        <div class="footer">
          Liên kết có hiệu lực trong vòng 1 giờ.<br>
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này. Mật khẩu hiện tại của bạn vẫn được bảo mật an toàn.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailThroughCloudflare({
    to,
    fullName,
    subject,
    html,
    actionUrl,
  });
};
