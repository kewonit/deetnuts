// app/page.tsx
import { Montserrat } from "next/font/google"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RankPredictor from './meow/RankPredictor'
import RankCalculator from './meow/calculateRank'
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MHTCET | Rank Predictor",
  description: "MHTCET | Rank Predictor",
};


const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})

export default function Home() {
  return (
    <div className={lato.className}>
      <div className='bg-[#DAF5F0]'>
        <main className='pt-20 pb-10 sm:pb-16 sm:pt-32 mx-auto max-w-xl p-4 h-[800px]'>
          <div className="py-4">
            <h1 className='text-3xl text-left font-bold'>MHT-CET Rank Predictor</h1>
            <p className="mx-auto text-sm">[cooldown of 5 sec]</p>
          </div>
          <Tabs defaultValue="account" className="max-w-xl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="2023">2023</TabsTrigger>
              <TabsTrigger value="Formula">Formula</TabsTrigger>
            </TabsList>
            <TabsContent value="2023">
              <Card>
                <CardHeader>
                  <CardTitle>2023</CardTitle>
                  <CardDescription>
                    Using previous years percentile with inflation to predict this years rank.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <RankPredictor />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="Formula">
              <Card>
                <CardHeader>
                  <CardTitle>Formula</CardTitle>
                  <CardDescription>
                    Calculate your rank based on percentile and total number of students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <RankCalculator />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}