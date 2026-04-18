declare module "react-random-shapes" {
  import { FC, SVGProps } from "react"

  export interface ShapeProps {
    width?: number
    height?: number
    size?: number
    numLines?: number
    numBlobs?: number
    seed?: string | number
    debug?: boolean
    styleTop?: SVGProps<SVGPathElement>
    styleMid?: SVGProps<SVGPathElement>
    styleBottom?: SVGProps<SVGPathElement>
    className?: string
  }

  export const RandomHLine: FC<ShapeProps>
  export const RandomBlob: FC<ShapeProps>
}
