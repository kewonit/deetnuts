interface RankData {
  rank: number;
  percentile: number;
}
  
  export function calculateRank(data: RankData[], userPercentile: number): number {
    // Sort the data based on percentile (higher percentile = better rank)
    const sortedData = data.sort((a, b) => b.percentile - a.percentile);
    
    // Find the first rank where the user's percentile is greater than or equal to the stored percentile
    const rankEntry = sortedData.find(entry => userPercentile >= entry.percentile);
    
    return rankEntry ? rankEntry.rank : sortedData[sortedData.length - 1].rank + 1;
  }