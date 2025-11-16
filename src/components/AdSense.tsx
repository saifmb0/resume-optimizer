interface AdSenseProps {
  slot: string
  format?: string
  responsive?: boolean
  style?: React.CSSProperties
}

export default function AdSense({ slot, format = 'auto', responsive = true, style }: AdSenseProps) {
  return (
    <div className="text-center my-8">
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
      {/* Placeholder for development - with dark mode support */}
      <div className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors duration-200">
        <p className="text-gray-500 dark:text-gray-400 font-medium">Google AdSense Advertisement</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Replace with actual AdSense code in production</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Slot: {slot}</p>
      </div>
    </div>
  )
}
