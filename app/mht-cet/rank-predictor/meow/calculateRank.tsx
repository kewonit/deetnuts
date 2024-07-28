'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COOLDOWN_TIME = 5000;

const RankCalculator: React.FC = () => {
  const [rank, setRank] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCooldown, setIsCooldown] = useState(false)
  const cooldownTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownTimeout.current) {
        clearTimeout(cooldownTimeout.current)
      }
    }
  }, [])

  const calculateRank = () => {
    if (isCooldown) {
      setError('Please wait before making another request.')
      return
    }

    const percentileInput = document.getElementById('percentile') as HTMLInputElement
    const totalStudentsInput = document.getElementById('totalStudents') as HTMLInputElement

    const percentile = parseFloat(percentileInput.value)
    const totalStudents = parseInt(totalStudentsInput.value)

    setError(null)
    setRank(null)

    if (isNaN(percentile) || isNaN(totalStudents)) {
      setError('Please enter valid numbers')
    } else if (percentile < 0 || percentile > 100) {
      setError('Percentile must be between 0 and 100')
    } else if (totalStudents <= 0) {
      setError('Total students must be greater than 0')
    } else {
      const calculatedRank = Math.round((1 - percentile / 100) * totalStudents + 1)
      setRank(`Your estimated rank is: ${calculatedRank}`)
    }

    setIsCooldown(true)
    cooldownTimeout.current = setTimeout(() => {
      setIsCooldown(false)
    }, COOLDOWN_TIME)
  }

  return (
    <>
      <div className="text-center text-lg font-semibold mb-4">
        Rank = (1 - Percentile / 100) × Total Students + 1
      </div>
      <div className='space-y-4 pb-4'>
        <div>
          <Label htmlFor="percentile">Percentile</Label>
          <Input id="percentile" type="number" placeholder="Enter percentile (0-100)" />
        </div>
        <div>
          <Label htmlFor="totalStudents">Total Students</Label>
          <Input id="totalStudents" type="number" placeholder="Enter total number of students" />
        </div>
      </div>
      <Button className="w-full mt-4" onClick={calculateRank} disabled={isCooldown}>
        {isCooldown ? 'Calculating...' : 'Calculate Rank'}
      </Button>
      {error && <div className="text-center font-semibold mt-4 text-red-500">{error}</div>}
      {rank && <div className="text-center font-semibold mt-4">{rank}</div>}
    </>
  )
}

export default RankCalculator
