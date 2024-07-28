// app/components/RankPredictor.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { fetchRankData } from '../actions/rankActions'

interface RankData {
  rank: number;
  percentile: number;
}

const COOLDOWN_TIME = 5000;

export default function RankPredictor() {
  const [percentile, setPercentile] = useState('')
  const [inflation, setInflation] = useState('')
  const [rank, setRank] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)

  const cooldownTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimeout.current) {
        clearTimeout(cooldownTimeout.current)
      }
    }
  }, [])

  function handlePercentileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPercentile(e.target.value)
  }

  function handleInflationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInflation(e.target.value)
  }

  async function handleCalculate() {
    if (isCooldown) {
      setErrorMessage('Please wait before making another request.')
      return
    }

    const percentileValue = parseFloat(percentile)
    const inflationValue = parseFloat(inflation)

    if (isNaN(percentileValue)) {
      setRank(null)
      setErrorMessage('Please enter a valid percentile.')
      return
    }

    if (percentileValue < 0 || percentileValue > 100) {
      setRank(null)
      setErrorMessage('Percentile should be between 0 and 100.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setRank(null) // Clear the current rank

    try {
      const data = await fetchRankData(percentileValue)

      if (data) {
        let calculatedRank = data.rank

        if (!isNaN(inflationValue) && inflationValue > 0) {
          calculatedRank = Math.round(calculatedRank * (1 + inflationValue / 100))
        }

        setRank(calculatedRank)
      } else {
        setRank(null)
        setErrorMessage('No rank data found for the given percentile.')
      }
    } catch (error) {
      console.error('Error fetching rank:', error)
      setErrorMessage('An error occurred while calculating the rank.')
    } finally {
      setIsLoading(false)
      setIsCooldown(true)
      cooldownTimeout.current = setTimeout(() => {
        setIsCooldown(false)
      }, COOLDOWN_TIME)
    }
  }

  return (
    <div>
      <div className='space-y-4 pb-4'>
        <div>
          <Label htmlFor="percentile">Percentile</Label>
          <Input 
            id="percentile"
            type="number"
            value={percentile}
            onChange={handlePercentileChange}
            placeholder="Enter percentile (0-100)"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor="inflation">Inflation %</Label>
          <Input 
            id='inflation'
            type="number"
            value={inflation}
            onChange={handleInflationChange}
            placeholder="Enter inflation percentage"
            min="0"
            step="0.1"
          />
        </div>
        <Button onClick={handleCalculate} className="w-full" disabled={isLoading || isCooldown}>
          {isLoading ? 'Calculating...' : 'Calculate Rank'}
        </Button>
      </div>
      <div className='text-center font-semibold'>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {isLoading ? (
          <p>Calculating...</p>
        ) : (
          rank !== null && <p>Your rank (with inflation): {rank}</p>
        )}
      </div>
    </div>
  )
}
