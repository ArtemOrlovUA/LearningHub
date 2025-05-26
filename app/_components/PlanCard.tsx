import React from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/20/solid';

interface PlanCardProps {
  planName: string;
  price: string;
  priceFrequency?: string;
  features: string[];
  buttonText: string;
  buttonLink?: string;
  onButtonClick?: () => void;
  isHighlighted?: boolean;
  highlightText?: string;
}

/**
 * A card component to display subscription plan details.
 * Mimics the style of pricing cards shown in the screenshot.
 */
export default function PlanCard({
  planName,
  price,
  priceFrequency = '/month',
  features,
  buttonText,
  buttonLink,
  onButtonClick,
  isHighlighted = false,
  highlightText,
}: PlanCardProps) {
  const cardBaseStyle = 'border border-gray-700 rounded-xl p-6 flex flex-col h-full';
  const highlightedStyle = isHighlighted
    ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-2xl'
    : 'bg-gray-800 shadow-lg';
  const buttonBaseStyle =
    'w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-75';
  const buttonNormalStyle = 'bg-white text-black hover:bg-gray-200 focus:ring-gray-400';
  const buttonHighlightedStyle = isHighlighted
    ? 'bg-white text-purple-700 hover:bg-gray-200 focus:ring-purple-300'
    : buttonNormalStyle;
  const textColor = isHighlighted ? 'text-white' : 'text-slate-100';
  const featureTextColor = isHighlighted ? 'text-purple-100' : 'text-slate-300';

  const renderButton = () => {
    const buttonClasses = `${buttonBaseStyle} ${buttonHighlightedStyle}`;
    if (buttonLink) {
      return (
        <Link href={buttonLink} className={buttonClasses}>
          {buttonText}
        </Link>
      );
    }
    if (onButtonClick) {
      return (
        <button onClick={onButtonClick} className={buttonClasses}>
          {buttonText}
        </button>
      );
    }
    return null;
  };

  return (
    <div className={`${cardBaseStyle} ${highlightedStyle}`}>
      <div className="min-h-[5.5rem] mb-4 flex flex-col items-center justify-center gap-1">
        <h3
          className={`text-lg font-semibold ${
            isHighlighted ? 'text-purple-200' : 'text-slate-400'
          }`}>
          {planName}
        </h3>
        {price === 'Free' ? (
          <h2 className={`text-4xl font-bold ${textColor}`}>Free</h2>
        ) : (
          <div className={textColor}>
            <span className="text-4xl font-bold">${price}</span>
            {priceFrequency && <span className="text-sm">{priceFrequency}</span>}
          </div>
        )}
      </div>

      <hr className={`my-4 ${isHighlighted ? 'border-purple-300' : 'border-gray-600'}`} />

      {highlightText && <p className={`font-semibold mb-3 ${textColor}`}>{highlightText}</p>}
      <p className={`mb-3 font-semibold ${textColor}`}>
        {!highlightText && features.length > 0 ? 'Includes:' : ''}
      </p>

      <ul className="space-y-2 mb-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className={`flex items-start ${featureTextColor}`}>
            <CheckIcon
              className={`h-5 w-5 mr-2 flex-shrink-0 ${
                isHighlighted ? 'text-purple-200' : 'text-green-400'
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">{renderButton()}</div>
    </div>
  );
}
