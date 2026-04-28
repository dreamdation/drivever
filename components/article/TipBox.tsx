interface TipBoxProps {
  children: React.ReactNode
}

export default function TipBox({ children }: TipBoxProps) {
  return (
    <div
      className="flex gap-3 items-start my-5 rounded-[8px] px-[18px] py-3.5"
      style={{ background: '#EBF3FF' }}
    >
      <div
        className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center text-accent font-bold text-[13px]"
        style={{ fontFamily: 'serif' }}
      >
        i
      </div>
      <div className="text-[0.9rem] leading-relaxed" style={{ color: '#1a4fa3' }}>
        {children}
      </div>
    </div>
  )
}
