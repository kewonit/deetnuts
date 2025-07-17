import React from 'react'
import { User, Users, PersonStanding } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const CollegeStats = ({ boys, girls }: { boys: any, girls: any }) => {
  const totalStudents = parseInt(boys) + parseInt(girls)
  const rowsCount = Math.ceil(totalStudents / 100)
  const seatsPerRow = 10
  const students = [
    ...Array(parseInt(girls)).fill('female'),
    ...Array(parseInt(boys)).fill('male')
  ].sort(() => Math.random() - 0.5)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Classroom Gender Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
          <div className="bg-gray-200 h-12 mb-8 rounded-lg flex items-center justify-center text-gray-700 font-semibold shadow">
            <PersonStanding className="mr-2" />
            Lecturer Stage
          </div>
          <div className="grid grid-cols-11 gap-2 mb-6">
            {Array.from({ length: rowsCount }).map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {Array.from({ length: seatsPerRow }).map((_, seatIndex) => {
                  const studentIndex = rowIndex * seatsPerRow + seatIndex
                  const student = students[studentIndex]
                  return (
                    <React.Fragment key={seatIndex}>
                      {seatIndex === 5 && <div className="w-6"></div>}
                      {student && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-8 h-8 rounded-t-lg ${
                                  student === 'female' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-blue-200 hover:bg-blue-300'
                                } flex items-center justify-center transition-colors duration-200 ease-in-out shadow`}
                              >
                                <User className={`w-5 h-5 ${student === 'female' ? 'text-pink-700' : 'text-blue-700'}`} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{`Student ${studentIndex + 1}: ${student}`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
          <Card>
            <CardContent className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-gray-700" />
                <span className="font-medium">Total Students: {totalStudents}</span>
              </div>
              <div className="flex space-x-4">
                <Badge variant="default" className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Male: {boys} ({((parseInt(boys) / totalStudents) * 100).toFixed(1)}%)</span>
                </Badge>
                <Badge variant="default" className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                  <span>Female: {girls} ({((parseInt(girls) / totalStudents) * 100).toFixed(1)}%)</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default CollegeStats