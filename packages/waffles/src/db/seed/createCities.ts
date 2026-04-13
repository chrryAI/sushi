import citiesData from "all-the-cities"
import { db, isProd } from "../../index"
import { cities } from "../schema"

export const createCities = async () => {
  const insertedCities: {
    name: string
    country: string
  }[] = []
  const isDev = !isProd

  const filteredCitiesData = isDev
    ? citiesData.filter((item) => {
        return ["NL", "JP"].includes(item.country)
      })
    : citiesData

  const existingCities = await db.select().from(cities)

  await Promise.all(
    filteredCitiesData.map(async (item) => {
      if (
        insertedCities.some(
          (city) => city.name === item.name && city.country === item.country,
        ) ||
        existingCities.some(
          (city: { name: string; country: string }) =>
            city.name === item.name && city.country === item.country,
        )
      ) {
        return
      }

      insertedCities.push(item)
      console.log("🏁 inserting City:", item.name, item.country)
      await db.insert(cities).values({
        name: item.name,
        country: item.country,
        population: item.population,
      })
    }),
  )
}
