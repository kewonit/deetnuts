# MHT-CET All India Cutoffs - Test Guide

## Quick Test Steps

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the page**:
   ```
   http://localhost:3000/mht-cet/all-india-cutoffs
   ```

3. **Test API endpoints directly**:
   ```
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-two
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-three
   ```

## Test Scenarios

### 1. Basic Functionality
- [ ] Page loads without errors
- [ ] All three round tabs are visible
- [ ] Data loads in the table
- [ ] Pagination controls work
- [ ] Loading states are visible

### 2. Search and Filtering
- [ ] Smart branch dropdown shows grouped engineering branches
- [ ] Branch groups include: Computer Science & IT, AI & Data Science, Cybersecurity & IoT, etc.
- [ ] Percentile range filters work (min to max percentile in "More Filters")
- [ ] Filter badges appear when filters are active
- [ ] Clear filters functionality works

### 3. Table Features
- [ ] Column sorting works (click headers)
- [ ] Table shows: Sr. No., Rank, Percentile, College Name, Course Name, Institute Code, Choice Code (in that order)
- [ ] Status column removed, Choice Code moved to last position
- [ ] Responsive design works on mobile
- [ ] Loading skeletons appear during data fetch
- [ ] Rank sorting shows lowest to highest by default

### 4. Performance
- [ ] Search is debounced (no immediate API calls while typing)
- [ ] Round switching is fast
- [ ] Page changes are smooth
- [ ] No memory leaks (check browser dev tools)

### 5. Error Handling
- [ ] Network errors show retry button
- [ ] Invalid filters handled gracefully
- [ ] Empty results show appropriate message
- [ ] No Select component errors in console
- [ ] No "removeChild" DOM errors when switching rounds
- [ ] Rapid round switching doesn't cause crashes

## Sample Test Data

Try these filters to test functionality:

1. **Search**: "computer science"
2. **Branch Group**: "Computer Science & IT" → "Computer Science and Engineering"
3. **Branch Group**: "AI & Data Science" → "Artificial Intelligence and Data Science"
4. **Percentile Range**: 85-95

## API Test Queries

```bash
# Test basic pagination
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?page=1&perPage=10"

# Test search
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?search=computer"

# Test branch filter
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?branch=Computer%20Science"

# Test percentile range
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?minPercentile=90&maxPercentile=95"

# Test sorting (lowest to highest rank)
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?sort=rank"
```

## Common Issues & Solutions

### Issue: Select component error about empty string values
- **Fixed**: Updated branch filter to use "all" instead of empty string
- **Solution**: Select components now use non-empty values for all options

### Issue: "removeChild" DOM error
- **Fixed**: Added proper keys to loading skeleton rows
- **Fixed**: Added component keys to force re-mounting on round changes
- **Fixed**: Added mounted state checks to prevent state updates after unmount
- **Solution**: Better React reconciliation and state management

### Issue: API returns empty data
- Check if PocketBase is running
- Verify collection names match exactly
- Ensure data exists in the collections

### Issue: Filters not working
- Check network tab for API calls
- Verify query parameters are being sent
- Check PocketBase filter syntax

### Issue: Slow performance
- Check if debouncing is working
- Monitor network requests in dev tools
- Verify only necessary fields are being fetched

### Issue: UI components not rendering
- Check if all UI components exist in `/components/ui/`
- Verify variant names match the component definitions
- Check for TypeScript errors

## Browser Developer Tools Tips

1. **Network Tab**: Monitor API calls and response times
2. **Console**: Check for JavaScript errors
3. **React DevTools**: Inspect component state and props
4. **Performance Tab**: Check for render bottlenecks

## Success Criteria

✅ All round data loads correctly  
✅ Filters work and update results in real-time  
✅ Percentile filtering available in "More Filters"  
✅ Pagination works smoothly  
✅ Rank sorting shows lowest to highest  
✅ Mobile responsive design  
✅ No console errors  
✅ Fast loading times (<2 seconds for initial load)  

If all criteria are met, the implementation is ready for production!
