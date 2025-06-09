import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageHeightClassName?: string;
}

export function FeatureCard({
  title,
  description,
  imageUrl,
  imageHeightClassName = 'h-[18rem]',
}: FeatureCardProps) {
  return (
    <div className="relative p-[2px] rounded-xl group">
      <div
        className="absolute inset-0 rounded-xl animate-gradient-xy"
        style={{
          background:
            'linear-gradient(45deg, #a855f7, #ec4899, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)',
          backgroundSize: '200% 200%',
        }}></div>

      <div className="relative bg-neutral-900 rounded-xl p-6 md:p-8 flex flex-col h-full">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h3>
        <p className="text-neutral-400 text-base md:text-lg mb-6 flex-grow">{description}</p>

        <div
          className={`mt-auto w-full relative overflow-hidden rounded-md ${imageHeightClassName}`}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-140"
          />
        </div>
      </div>
    </div>
  );
}
