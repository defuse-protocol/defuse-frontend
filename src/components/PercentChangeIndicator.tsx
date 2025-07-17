const PercentChangeIndicator = ({
  percentChange,
}: {
  percentChange: number
}) => {
  return (
    <div className="flex flex-row justify-center items-center gap-2 text-sm text-gray-12 font-medium">
      {typeof percentChange === "number" && (
        <>
          <span
            className={
              percentChange > 0
                ? "text-green-600 font-medium"
                : percentChange < 0
                  ? "text-red-600 font-medium"
                  : "text-gray-11 font-medium"
            }
          >
            {Math.abs(percentChange).toFixed(2)}%
          </span>
          {percentChange > 0 ? (
            <svg
              className="w-3 h-3 text-green-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Up arrow</title>
              <path d="M12 8L19 15H5L12 8Z" />
            </svg>
          ) : percentChange < 0 ? (
            <svg
              className="w-3 h-3 text-red-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Down arrow</title>
              <path d="M12 16L19 9H5L12 16Z" />
            </svg>
          ) : null}
        </>
      )}
    </div>
  )
}

export default PercentChangeIndicator
