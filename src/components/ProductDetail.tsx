"use client";

import Link from "next/link";
import { ADCProduct } from "@/lib/types";
import ClickableField from "./ClickableField";

interface Props {
  product: ADCProduct;
}

// 通用区块容器 — 带标题和发光边框
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cyber-card p-5 space-y-3">
      <h3 className="text-sm font-bold text-cyber-accent tracking-wide uppercase glow-text">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

// 标签-内容行，左侧固定宽度标签，右侧自适应
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="text-xs font-medium text-cyber-text2 min-w-[120px] shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5 items-center">{children}</div>
    </div>
  );
}

export default function ProductDetail({ product: p }: Props) {
  return (
    <div className="space-y-5">
      {/* 顶部标题区：商品名 + 通用名 + 阶段 + 批准年份 + 批准地区 */}
      <div className="cyber-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold gradient-text">{p.brandName}</h1>
            <p className="text-sm text-cyber-text2 mt-2">
              {p.genericNameEn} / {p.genericNameCn}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ClickableField value={p.stage} href={`/products?stage=${encodeURIComponent(p.stage)}`} color="green" />
            {p.approvalYear && (
              <span className="text-sm text-cyber-text2">
                首次批准: <span className="text-cyber-text font-bold">{p.approvalYear}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {p.approvalRegions.map((r) => (
            <span key={r} className="text-xs bg-cyber-accent/10 text-cyber-accent px-2 py-0.5 rounded-full border border-cyber-accent/30">{r}</span>
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <Section title="基本信息">
        <Row label="靶点">
          <ClickableField value={p.target} href={`/products?target=${encodeURIComponent(p.target)}`} color="pink" />
        </Row>
        <Row label="抗体">
          <span className="text-sm text-cyber-text">{p.antibody}</span>
        </Row>
        <Row label="抗体亚型">
          <span className="text-sm text-cyber-text">{p.antibodySubclass || "-"}</span>
        </Row>
        <Row label="适应症">
          {p.indication.map((ind) => (
            <ClickableField key={ind} value={ind} href={`/products?indication=${encodeURIComponent(ind)}`} color="green" />
          ))}
        </Row>
        <Row label="原研公司">
          <ClickableField value={p.companyOriginator} href={`/products?company=${encodeURIComponent(p.companyOriginator)}`} color="orange" />
        </Row>
        {p.companyLicensee && (
          <Row label="合作/授权">
            <ClickableField value={p.companyLicensee} href={`/products?company=${encodeURIComponent(p.companyLicensee.split("/")[0].trim())}`} color="orange" />
          </Row>
        )}
      </Section>

      {/* 载荷 + 连接子：名称、类型、机制、SMILES、结构式图 */}
      <Section title="载荷 & 连接子">
        <Row label="载荷名称">
          <span className="text-sm text-cyber-text font-mono">{p.payloadName}</span>
        </Row>
        <Row label="载荷类型">
          <ClickableField value={p.payloadClass} href={`/products?payloadClass=${encodeURIComponent(p.payloadClass)}`} color="accent" />
        </Row>
        <Row label="作用机制">
          <span className="text-sm text-cyber-text2">{p.payloadMechanism}</span>
        </Row>
        {p.payloadSmiles && (
          <Row label="SMILES">
            <span className="text-xs text-cyber-text2 font-mono bg-cyber-bg/50 px-2 py-1 rounded break-all">{p.payloadSmiles}</span>
          </Row>
        )}
        {p.payloadStructure && (
          <Row label="结构式">
            <img src={p.payloadStructure} alt="Payload structure" className="max-w-full max-h-48 rounded-lg border border-cyber-border/50 bg-white/10 p-1" />
          </Row>
        )}
        <Row label="连接子">
          <span className="text-sm text-cyber-text font-mono">{p.linkerName}</span>
        </Row>
        <Row label="连接子类型">
          <ClickableField value={p.linkerType} href={`/products?linkerType=${encodeURIComponent(p.linkerType)}`} color="accent" />
        </Row>
        <Row label="连接子结构">
          <span className="text-xs text-cyber-text2 font-mono bg-cyber-bg/50 px-2 py-0.5 rounded">{p.linkerStructure}</span>
        </Row>
      </Section>

      {/* 偶联工艺：偶联方式、位点、化学、DAR 等 */}
      <Section title="偶联工艺">
        <Row label="偶联方式">
          <ClickableField value={p.conjugationMethod} href={`/products?conjugationMethod=${encodeURIComponent(p.conjugationMethod)}`} color="purple" />
        </Row>
        <Row label="偶联位点">
          <span className="text-sm text-cyber-text">{p.conjugationSite}</span>
        </Row>
        <Row label="偶联化学">
          <span className="text-sm text-cyber-text font-mono">{p.conjugationChemistry}</span>
        </Row>
        <Row label="DAR">
          <span className="text-sm text-cyber-accent font-bold">{p.dar}</span>
        </Row>
        <Row label="DAR 分布">
          <span className="text-sm text-cyber-text2">{p.darDistribution}</span>
        </Row>
        <Row label="纯化方式">
          <span className="text-sm text-cyber-text2">{p.purificationMethod || "-"}</span>
        </Row>
      </Section>

      {/* Formulation & Lyophilization */}
      <Section title="制剂 & 冻干工艺">
        <Row label="剂型">
          <span className="text-sm text-cyber-text font-bold">{p.dosageForm}</span>
        </Row>
        {p.manufacturer && (
          <Row label="生产厂家">
            <span className="text-sm text-cyber-text">{p.manufacturer}</span>
          </Row>
        )}
        <Row label="冻干">
          <span className={`text-sm font-bold ${p.lyophilization ? "text-cyber-accent" : "text-cyber-orange"}`}>
            {p.lyophilization ? "是" : "否"}
          </span>
        </Row>
        {p.lyophilization && (
          <>
            {p.lyoExcipientsBuffer && (
              <Row label="缓冲体系">
                <span className="text-sm text-cyber-text2">{p.lyoExcipientsBuffer}</span>
              </Row>
            )}
            {p.lyoExcipientsStabilizer && (
              <Row label="稳定剂/赋形剂">
                <span className="text-sm text-cyber-text2">{p.lyoExcipientsStabilizer}</span>
              </Row>
            )}
            {p.lyoExcipientsSurfactant && (
              <Row label="表面活性剂">
                <span className="text-sm text-cyber-text2">{p.lyoExcipientsSurfactant}</span>
              </Row>
            )}
            {p.lyoPh && (
              <Row label="pH">
                <span className="text-sm text-cyber-text2">{p.lyoPh}</span>
              </Row>
            )}
            {p.lyoPreConc && (
              <Row label="冻干前浓度">
                <span className="text-sm text-cyber-text2">{p.lyoPreConc}</span>
              </Row>
            )}
            {p.lyoPostConc && (
              <Row label="复溶后浓度">
                <span className="text-sm text-cyber-text2">{p.lyoPostConc}</span>
              </Row>
            )}
            {p.lyoCycle && (
              <Row label="冻干工艺">
                <span className="text-sm text-cyber-text2">{p.lyoCycle}</span>
              </Row>
            )}
            {p.reconstitutionMedia && (
              <Row label="复溶溶媒">
                <span className="text-sm text-cyber-text2">{p.reconstitutionMedia}</span>
              </Row>
            )}
          </>
        )}
        {!p.lyophilization && p.liquidExcipients && (
          <Row label="辅料(注射液)">
            <span className="text-sm text-cyber-text2">{p.liquidExcipients}</span>
          </Row>
        )}
        {p.storageCondition && (
          <Row label="储存条件">
            <span className="text-sm text-cyber-text2">{p.storageCondition}</span>
          </Row>
        )}
        {p.shelfLife && (
          <Row label="有效期">
            <span className="text-sm text-cyber-text2">{p.shelfLife}</span>
          </Row>
        )}
        {p.containerClosure && (
          <Row label="包材">
            <span className="text-sm text-cyber-text2">{p.containerClosure}</span>
          </Row>
        )}
      </Section>

      {/* Analytics */}
      {(p.purityMethod || p.potencyMethod || p.criticalQualityAttrs) && (
        <Section title="分析 & 质控">
          {p.criticalQualityAttrs && (
            <Row label="CQA">
              <span className="text-sm text-cyber-text2">{p.criticalQualityAttrs}</span>
            </Row>
          )}
          {p.purityMethod && (
            <Row label="纯度方法">
              <span className="text-sm text-cyber-text2">{p.purityMethod}</span>
            </Row>
          )}
          {p.potencyMethod && (
            <Row label="活性方法">
              <span className="text-sm text-cyber-text2">{p.potencyMethod}</span>
            </Row>
          )}
        </Section>
      )}

      {/* Cell line & sequence */}
      {(p.cellLine || p.antibodySequenceHeavy || p.antibodySequenceLight || p.signalPeptide || p.plasmidInfo) && (
        <Section title="细胞株 & 序列">
          {p.cellLine && (
            <Row label="细胞类型">
              <span className="text-sm text-cyber-text">{p.cellLine}</span>
            </Row>
          )}
          {p.antibodySequenceHeavy && (
            <Row label="重链序列">
              <span className="text-xs text-cyber-text2 font-mono bg-cyber-bg/50 px-2 py-1 rounded break-all max-h-24 overflow-y-auto block">{p.antibodySequenceHeavy}</span>
            </Row>
          )}
          {p.antibodySequenceLight && (
            <Row label="轻链序列">
              <span className="text-xs text-cyber-text2 font-mono bg-cyber-bg/50 px-2 py-1 rounded break-all max-h-24 overflow-y-auto block">{p.antibodySequenceLight}</span>
            </Row>
          )}
          {p.signalPeptide && (
            <Row label="信号肽">
              <span className="text-sm text-cyber-text font-mono">{p.signalPeptide}</span>
            </Row>
          )}
          {p.plasmidInfo && (
            <Row label="质粒信息">
              <span className="text-sm text-cyber-text2">{p.plasmidInfo}</span>
            </Row>
          )}
        </Section>
      )}

      {/* PDB */}
      {p.pdbId && (
        <Section title="PDB 结构">
          <Row label="PDB 编号">
            <a
              href={`https://www.rcsb.org/structure/${p.pdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyber-accent hover:underline font-mono"
            >
              {p.pdbId}
            </a>
          </Row>
        </Section>
      )}

      {/* Patents & References */}
      <Section title="专利 & 来源验证">
        {p.patentNumber && p.patentNumber !== "未公开" && (
          <Row label="专利号">
            {p.patentNumber.split(";").map((pn) => {
              const num = pn.trim();
              return (
                <ClickableField
                  key={num}
                  value={num}
                  href={`https://patents.google.com/patent/${num}/en`}
                  external
                  color="accent"
                />
              );
            })}
          </Row>
        )}
        {p.patentTitle && (
          <Row label="专利标题">
            <span className="text-sm text-cyber-text2">{p.patentTitle}</span>
          </Row>
        )}
        {p.patentAssignee && (
          <Row label="专利权人">
            <ClickableField value={p.patentAssignee} color="orange" />
          </Row>
        )}
        {p.referenceLabel && (
          <Row label="说明书/来源">
            <ClickableField
              value={p.referenceLabel}
              href={p.referenceUrl || undefined}
              external={!!p.referenceUrl}
              badge={false}
              color="accent"
            />
          </Row>
        )}
      </Section>

      {/* Back link */}
      <div className="flex gap-3 pt-4">
        <Link href="/products" className="text-sm text-cyber-text2 hover:text-cyber-accent transition-colors no-underline flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          返回产品列表
        </Link>
        <Link href="/visualize" className="text-sm text-cyber-accent2 hover:text-cyber-accent transition-colors no-underline">
          在可视化中查看 →
        </Link>
      </div>
    </div>
  );
}
