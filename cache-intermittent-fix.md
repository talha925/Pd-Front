# Intermittent Cache Issue Fix

## Problem Description:
- Updated data shows initially
- On refresh: old data appears
- Next refresh: new data appears
- Pattern continues alternating between old and new data

## Root Cause:
**Stale-While-Revalidate** caching strategy was causing this behavior:

1. **First Request**: Serves stale (old) data from cache
2. **Background**: Fetches fresh data and updates cache
3. **Second Request**: Serves fresh (new) data
4. **Third Request**: Serves stale data again (cycle repeats)

## Files Fixed:

### 1. Core Cache Library
- **File**: `src/lib/cache.ts`
- **Change**: Replaced `stale-while-revalidate` with `must-revalidate`
- **Impact**: Ensures cache validation before serving data

### 2. Blogs API Routes
- **Files**: 
  - `src/app/api/blogs/route.ts`
  - `src/app/api/blogs/search/route.ts`
- **Change**: Removed `stale-while-revalidate=600` 
- **Impact**: Consistent blog data serving

### 3. Stores API Routes
- **Files**:
  - `src/app/api/stores/search/route.ts`
  - `src/app/api/store/[slug]/route.ts`
- **Change**: Replaced with `must-revalidate`
- **Impact**: Consistent store data serving

## Solution Applied:
Replaced all instances of:
```
stale-while-revalidate=X
```

With:
```
must-revalidate
```

## Expected Behavior After Fix:
- ✅ Consistent data on every refresh
- ✅ No alternating between old/new data
- ✅ Cache still works for performance
- ✅ Data freshness guaranteed

## Cache Strategy Comparison:

### Before (Stale-While-Revalidate):
- Serves stale data immediately
- Updates cache in background
- Can serve outdated data
- Better performance, worse consistency

### After (Must-Revalidate):
- Validates cache before serving
- Ensures data freshness
- Consistent user experience
- Slightly slower but reliable

## Testing Steps:
1. Deploy the changes
2. Clear browser cache
3. Refresh multiple times
4. Verify consistent data loading
5. Check that updates reflect immediately

## Performance Impact:
- Minimal performance impact
- Cache still active for specified duration
- Better user experience with consistent data
- No more confusing alternating content