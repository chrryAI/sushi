declare module "falkordb" {
  export class FalkorDB {
    static connect(options: any): Promise<FalkorDBClient>
  }

  export class FalkorDBClient {
    selectGraph(name: string): FalkorDBGraph
    list(): Promise<any>
    query(q: string): Promise<any>
  }

  export class FalkorDBGraph {
    query(q: string): Promise<any>
  }
}
