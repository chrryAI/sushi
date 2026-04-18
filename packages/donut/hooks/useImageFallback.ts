import { useCallback, useState } from "react"

/**
 * Abstract fallback images for broken/missing chat files
 */
export const FALLBACK_ABSTRACT_IMAGES: string[] = [
  "/images/abstract/abstract-2.png",
  "/images/abstract/abstract.png",
  "/images/abstract/cable.png",
  "/images/abstract/climbing-ropes.png",
  "/images/abstract/coral-tube-2.png",
  "/images/abstract/cotton-flower.png",
  "/images/abstract/cubes.png",
  "/images/abstract/cylinder.png",
  "/images/abstract/flower-spiral-5.png",
  "/images/abstract/flower.png",
  "/images/abstract/fur-abstract.png",
  "/images/abstract/fur-cactus.png",
  "/images/abstract/fur-coral.png",
  "/images/abstract/fur-curve.png",
  "/images/abstract/fur-flower.png",
  "/images/abstract/fur-spiral.png",
  "/images/abstract/gradient-curve.png",
  "/images/abstract/grid.png",
  "/images/abstract/inflated-circle.png",
  "/images/abstract/lego.png",
  "/images/abstract/liquid-curves.png",
  "/images/abstract/liquid-metal.png",
  "/images/abstract/liquid.png",
  "/images/abstract/metaballs-2.png",
  "/images/abstract/metaballs.png",
  "/images/abstract/smile-cube.png",
  "/images/abstract/smile.png",
  "/images/abstract/sofa.png",
  "/images/abstract/soft-shapes.png",
  "/images/abstract/spin.png",
  "/images/abstract/spiral.png",
  "/images/abstract/star.png",
  "/images/abstract/tiles.png",
  "/images/abstract/zik-zak.png",
]

/**
 * Animal fallback images for broken/missing chat files
 */
export const FALLBACK_ANIMAL_IMAGES: string[] = [
  "/images/animals/bear.png",
  "/images/animals/bee.png",
  "/images/animals/blue-fish.png",
  "/images/animals/butterfly.png",
  "/images/animals/camel.png",
  "/images/animals/capybara.png",
  "/images/animals/cat.png",
  "/images/animals/cow.png",
  "/images/animals/crab.png",
  "/images/animals/deer.png",
  "/images/animals/dog.png",
  "/images/animals/dolphin.png",
  "/images/animals/duck.png",
  "/images/animals/eagle.png",
  "/images/animals/elephant.png",
  "/images/animals/flamingo.png",
  "/images/animals/fox.png",
  "/images/animals/frog.png",
  "/images/animals/giraffe.png",
  "/images/animals/goldfish.png",
  "/images/animals/hamster.png",
  "/images/animals/hedgehog.png",
  "/images/animals/hippo.png",
  "/images/animals/horse.png",
  "/images/animals/iguana.png",
  "/images/animals/koala.png",
  "/images/animals/ladybug.png",
  "/images/animals/lion.png",
  "/images/animals/octopus.png",
  "/images/animals/owl.png",
  "/images/animals/panda.png",
  "/images/animals/parrot.png",
  "/images/animals/penguin.png",
  "/images/animals/phoenix.png",
  "/images/animals/pig.png",
  "/images/animals/pigeon.png",
  "/images/animals/rabbit.png",
  "/images/animals/raccon.png",
  "/images/animals/seahorse.png",
  "/images/animals/snake.png",
  "/images/animals/toucan.png",
  "/images/animals/turtle.png",
  "/images/animals/unicorn.png",
  "/images/animals/whale.png",
  "/images/animals/zebra.png",
]

/**
 * Food fallback images for broken/missing chat files
 */
export const FALLBACK_FOOD_IMAGES: string[] = [
  "/images/food/apple.png",
  "/images/food/avocado.png",
  "/images/food/banana.png",
  "/images/food/broccoli.png",
  "/images/food/carrot.png",
  "/images/food/cherry.png",
  "/images/food/chocolate-bar.png",
  "/images/food/chocolate-cake.png",
  "/images/food/chocolate-cookie.png",
  "/images/food/corn.png",
  "/images/food/croissant.png",
  "/images/food/cup-of-tea.png",
  "/images/food/cupcake.png",
  "/images/food/donut.png",
  "/images/food/frappuccino.png",
  "/images/food/french-fries.png",
  "/images/food/fried-egg.png",
  "/images/food/grape.png",
  "/images/food/hamburger.png",
  "/images/food/hotdog.png",
  "/images/food/ice-cream-bar.png",
  "/images/food/ice-cream.png",
  "/images/food/lemon.png",
  "/images/food/lollipop.png",
  "/images/food/pancakes.png",
  "/images/food/peach.png",
  "/images/food/pear.png",
  "/images/food/pepper.png",
  "/images/food/pizza-slice-min-1.png",
  "/images/food/pizza.png",
  "/images/food/popcorn.png",
  "/images/food/ramen.png",
  "/images/food/rasberry.png",
  "/images/food/sandwich.png",
  "/images/food/strawberry.png",
  "/images/food/sushi-roll.png",
  "/images/food/sushi-set.png",
  "/images/food/sushi.png",
  "/images/food/taco.png",
  "/images/food/tomato.png",
  "/images/food/waffles.png",
  "/images/food/watermelon.png",
]

export const FALLBACK_IMAGE_MODES = ["abstract", "animals", "food"] as const
export type FallbackImageMode = (typeof FALLBACK_IMAGE_MODES)[number]

function fuzzysearch(needle: string, haystack: string): boolean {
  const hlen = haystack.length
  const nlen = needle.length
  if (nlen > hlen) return false
  if (nlen === hlen) return needle === haystack
  outer: for (let i = 0, j = 0; i < nlen; i++) {
    const nch = needle.charCodeAt(i)
    while (j < hlen) {
      if (haystack.charCodeAt(j++) === nch) continue outer
    }
    return false
  }
  return true
}

function resolveMode(input: string): FallbackImageMode {
  const lower = input.toLowerCase()
  for (const mode of FALLBACK_IMAGE_MODES) {
    if (mode === lower) return mode
  }
  for (const mode of FALLBACK_IMAGE_MODES) {
    if (fuzzysearch(lower, mode)) return mode
  }
  return "abstract"
}

function getPool(resolved: FallbackImageMode): string[] {
  switch (resolved) {
    case "animals":
      return FALLBACK_ANIMAL_IMAGES
    case "food":
      return FALLBACK_FOOD_IMAGES
    default:
      return FALLBACK_ABSTRACT_IMAGES
  }
}

/**
 * Get a random fallback image from the requested mode.
 * Supports fuzzy mode matching: "abs", "ani", "foo", etc.
 */
export function getRandomFallbackImage(
  mode: string = "abstract",
): string | null {
  const resolved = resolveMode(mode)
  const pool = getPool(resolved)
  if (pool.length === 0) return null
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex] || null
}

/**
 * Hook to get a random fallback image.
 * Supports fuzzy mode matching: "abs", "ani", etc.
 * Usage:
 *   const { src } = useImageFallback("animals")
 */
export function useImageFallback(mode: string = "abstract") {
  const [src, setSrc] = useState<string | null>(() =>
    getRandomFallbackImage(mode),
  )

  const refresh = useCallback(() => {
    setSrc(getRandomFallbackImage(mode))
  }, [mode])

  return { src: src || "", refresh }
}

/**
 * Simple fallback handler for img elements.
 * Supports fuzzy mode matching.
 * Usage:
 *   <img src={url} onError={(e) => handleImageError(e, "animals")} />
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  mode: string = "abstract",
) {
  const fallback = getRandomFallbackImage(mode)
  if (fallback && event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback
  }
}
