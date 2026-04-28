interface LawBoxProps {
  lawRef?: string
  children: React.ReactNode
}

export default function LawBox({ lawRef, children }: LawBoxProps) {
  return (
    <div
      className="my-5"
      style={{
        borderLeft: '4px solid #0070F3',
        background: '#FAFAFA',
        padding: '14px 18px',
        borderRadius: 0,
      }}
    >
      {lawRef && (
        <div
          className="text-[11px] font-bold text-accent mb-1.5"
          style={{ letterSpacing: '0.06em' }}
        >
          {lawRef}
        </div>
      )}
      <div className="text-[0.9375rem] text-[#333] leading-[1.65]">{children}</div>
    </div>
  )
}
