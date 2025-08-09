interface Props {
  src: string
}

export function Background({ src }: Props) {
  return (
    <div className="absolute inset-0">
      <img src={src} className="w-full h-full object-cover" alt="background" />
    </div>
  )
}


