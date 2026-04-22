export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse mr-3" />
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-64 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classes Section Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mr-3" />
                    <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                      <div className="flex space-x-4">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mr-3" />
                  <div className="w-20 h-5 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badge Skeleton */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse mx-auto mb-4" />
                <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                <div className="w-48 h-3 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
                <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
