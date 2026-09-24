import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const PRIVACY_CONSENT_KEY = 'food_privacy_consent_v1';

const policyInfo = {
  operator: import.meta.env.VITE_OPERATOR_NAME?.trim() || '饭时记开源项目维护者',
  email: import.meta.env.VITE_CONTACT_EMAIL?.trim() || '请通过 GitHub 仓库 Issues 联系维护者',
  address: import.meta.env.VITE_CONTACT_ADDRESS?.trim() || '本应用不收集联系地址',
  updated: import.meta.env.VITE_PRIVACY_UPDATED?.trim() || '2026-09-24'
};

function fillPolicyFields(text) {
  return text
    .replaceAll('[项目维护者]', policyInfo.operator)
    .replaceAll('[联系渠道]', policyInfo.email)
    .replaceAll('[联系地址]', policyInfo.address);
}

const sections = [
  ['一、处理者与联系信息', '个人信息处理者：[项目维护者]。联系渠道：[联系渠道]。联系地址：[联系地址]。本应用没有开发者账号或开发者云端同步功能。'],
  ['二、本机记录和身体档案', '你主动填写的餐食名称、餐次、时间、分量、营养数值、点评和照片，以及性别、年龄、身高、体重、活动水平、个人目标和营养目标，保存在本机 IndexedDB 或 LocalStorage。你可以不填写身体档案。卸载应用、清除应用数据或设备故障可能导致本机记录无法恢复。相关身体资料可能属于健康相关信息；本应用只在你主动使用相关功能时使用。'],
  ['三、DeepSeek AI 与信息发送', '仅在你主动配置 API Key、单独勾选 AI 数据授权并发起请求时，应用会把所需信息发送到杭州深度求索人工智能基础技术研究有限公司提供的 DeepSeek API：照片识别会发送压缩后的食物照片和补充说明；文字识别会发送餐食描述；AI 教练可能发送本次对话、当天饮食摘要、营养目标及已填写的身体档案。API Key 会随请求用于服务验证。你可以在设置中撤回 AI 授权；之后 AI 请求会被阻止。DeepSeek API 的处理规则参见其官方隐私政策。'],
  ['四、权限', 'Android 网络访问用于你主动使用 AI 时连接 DeepSeek。拍照或选图使用系统文件选择器；本应用不会在你未选择图片时读取图库内容。'],
  ['五、存储、期限与删除', '餐食记录和照片保存在本机 IndexedDB；部分档案、目标和设置保存在本机 LocalStorage。Android 版 API Key 使用 Android Keystore 加密后保存；其他运行环境由对应平台的本地存储机制保存。信息保留至你主动删除、清除本机数据或卸载应用；DeepSeek 接收到的信息依其官方政策处理。你可以在设置中清除全部本机记录、照片、身体档案、目标及 API Key。'],
  ['六、你的权利', '你可以在应用内查阅、修改和删除身体档案及餐食记录，撤回 AI 授权，或清除全部本机数据。需要帮助时可通过以下渠道联系维护者：[联系渠道]。'],
  ['七、未成年人', '不满十四周岁的未成年人应在监护人同意和指导下使用。如本应用处理不满十四周岁未成年人的个人信息，将依法取得监护人同意并采取专门保护措施。'],
  ['八、政策更新与服务边界', '功能或数据处理方式变更时，我们会更新本政策并在适用情况下重新取得同意。营养估算和 AI 回复可能不准确，仅供日常记录参考，不构成疾病诊断或治疗建议。拒绝本政策后不能继续使用本应用。']
];

export function PrivacyGate({ onAccepted }) {
  const [rejected, setRejected] = useState(false);

  const accept = () => {
    localStorage.setItem(PRIVACY_CONSENT_KEY, 'accepted');
    onAccepted();
  };

  if (rejected) {
    return (
      <div className="consent-page">
        <section className="consent-card glass-panel" role="status">
          <ShieldCheck size={28} color="var(--primary)" />
          <h1>尚未同意隐私政策</h1>
          <p>饭时记需要按隐私政策处理本机饮食记录才能提供服务。你已选择拒绝，应用不会继续读取这些记录。关闭此页面即可退出。</p>
          <button className="button-secondary" onClick={() => window.close()}>关闭</button>
        </section>
      </div>
    );
  }

  return (
    <div className="consent-page">
      <section className="consent-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <div className="consent-icon"><ShieldCheck size={24} /></div>
        <p className="eyebrow">饭时记 · 隐私保护</p>
        <h1 id="privacy-title">请先阅读隐私政策</h1>
        <p className="consent-lead">在继续前，请了解饭时记如何处理你的信息。你可以选择同意或拒绝。</p>
        <div className="policy-scroll">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{fillPolicyFields(body)}</p>
            </section>
          ))}
          <p className="provider-policy"><a href="https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html" target="_blank" rel="noreferrer">DeepSeek 官方隐私政策 ↗</a></p>
          <p className="legal-updated">更新日期：{policyInfo.updated}</p>
        </div>
        <div className="consent-actions">
          <button className="button-secondary" onClick={() => setRejected(true)}>不同意并退出</button>
          <button className="button-primary" onClick={accept}>同意并继续</button>
        </div>
      </section>
    </div>
  );
}

export default function PrivacyCenter({ type, onClose }) {
  const title = type === 'terms' ? '用户服务协议' : '隐私政策';
  const body = type === 'terms'
    ? [
        ['服务内容', '饭时记提供饮食记录、营养目标管理、基础营养估算，以及用户主动配置 DeepSeek API Key 后的 AI 辅助识别和饮食建议。'],
        ['本机数据', '当前版本没有账号和开发者云端同步。餐食记录、照片、身体档案和设置保存在本机；更换设备、卸载或清除应用数据可能造成记录丢失。'],
        ['AI 服务与费用', 'AI 功能由用户自愿开启。请求内容发送至饭时记设置页展示的 DeepSeek 官方 API 地址。DeepSeek API 的可用性和费用依 DeepSeek 官方规则；使用个人 Key 产生的费用由对应账号承担。请勿泄露 API Key。'],
        ['结果边界', 'AI 识别、热量与营养数据均为自动估算，可能不准确、不完整或不适合特定个人。内容仅供日常记录参考，不构成医疗诊断或治疗建议。重要健康问题请咨询合格专业人员。'],
        ['使用规范与联系', '请勿上传未经授权的他人照片或信息，或利用本应用传播违法内容。项目维护者：[项目维护者]；联系渠道：[联系渠道]。']
      ]
      : sections;

  return (
    <div className="legal-backdrop" role="presentation" onClick={onClose}>
      <section className="legal-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={event => event.stopPropagation()}>
        <header className="legal-header">
          <div><p className="eyebrow">饭时记</p><h2 id="legal-title">{title}</h2></div>
          <button className="icon-button" aria-label="关闭" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="policy-scroll legal-scroll">
          {body.map(([heading, text]) => (
            <section key={heading}><h3>{heading}</h3><p>{fillPolicyFields(text)}</p></section>
          ))}
          {type !== 'terms' && <p className="provider-policy"><a href="https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html" target="_blank" rel="noreferrer">DeepSeek 官方隐私政策 ↗</a></p>}
          <p className="legal-updated">更新日期：{policyInfo.updated}</p>
        </div>
        <button className="button-primary legal-close" onClick={onClose}>我已阅读</button>
      </section>
    </div>
  );
}
