/**
 * Debug FalkorDB query results
 */

import { FalkorDB } from 'falkordb';

async function main() {
  const db = await FalkorDB.connect({
    socket: { host: 'localhost', port: 6380 }
  });
  
  const bugsGraph = db.selectGraph('porffor_bugs');
  
  const result = await bugsGraph.query(`
    MATCH (b:Bug)
    RETURN b.type as type, b.severity as severity, b.suggestion as suggestion, COUNT(b) as count
    ORDER BY count DESC
    LIMIT 3
  `);
  
  console.log('Result type:', typeof result);
  console.log('Result keys:', Object.keys(result));
  console.log('Result.data type:', typeof result.data);
  console.log('Result.data:', result.data);
  
  if (result.data && result.data.length > 0) {
    console.log('\nFirst row:', result.data[0]);
    console.log('First row type:', typeof result.data[0]);
    console.log('First row keys:', Object.keys(result.data[0] || {}));
  }
  
  await db.close();
}

main().catch(console.error);
