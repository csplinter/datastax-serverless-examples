'use strict';

const cassandra = require('cassandra-driver');
const contactPoints = process.env['CONTACT_POINTS'];
const localDataCenter = process.env['LOCAL_DC'];
const keyspace = 'shopping';
const table = 'catalog';

if (!contactPoints) throw new Error('Environment variable CONTACT_POINTS not set');
if (!localDataCenter) throw new Error('Environment variable LOCAL_DC not set');

// useful for determining container re-use
const myuuid = cassandra.types.TimeUuid.now();
console.log('timeuuid in container startup: ' + myuuid);

const client = new cassandra.Client({
  contactPoints: contactPoints.split(','),
  localDataCenter,

  // AWS Lambda freezes the function execution context after the callback has been invoked. 
  // This means that no background activity can occur between lambda invocations, 
  // including the heartbeat that the driver uses to prevent idle disconnects in some environments.
  // At this time we have not done enough testing to validate if this behavior applies to Google Cloud Functions as well,
  // though it may be best to disable heartbeats if this is the case. This is accomplished with the setting below.
  //
  // pooling: { heartBeatInterval: 0 }
  
  // If trying to reduce Cold Start time, the driver's automatic metadata synchronization and pool warmup can be disabled 
  //
  // isMetadataSyncEnabled: false,
  // pooling: { warmup: false }
});

// Enable logging for the purpose of example
client.on('log', (level, className, message) => {
  if (level !== 'verbose') {
    console.log('Driver log event', level, className, message);
  }
});

const createKeyspace = `CREATE KEYSPACE IF NOT EXISTS ${keyspace} ` +
                       `WITH REPLICATION = {'class':'NetworkTopologyStrategy','${localDataCenter}': 1}`;

const createTable = `CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (item_id int, name text, description text, price decimal, ` + 
                    `PRIMARY KEY (item_id))`;

const writeQuery = `INSERT INTO ${keyspace}.${table} (item_id, name, description, price) VALUES (?, ?, ?, ?)`;

const readQuery = `SELECT name, description, price FROM ${keyspace}.${table} WHERE item_id = ?`;

client.connect()
  .then(() => console.log('Connected to the DSE cluster, discovered %d nodes', client.hosts.length))
  .catch(err => console.error('There was an error trying to connect', err));

async function createSchema() {
  await client.execute(createKeyspace);
  await client.execute(createTable);
  return {statusCode: 200, body: `Successfully created ${keyspace}.${table} schema`};
}

async function addItem(item_id, name, description, price) {
  const params = [ item_id, name, description, price ];
  await client.execute(writeQuery, params, { prepare: true, isIdempotent: true });
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: writeQuery,
      item_id: item_id,
      name: name,
      description: description,
      price: price
      })
  };
}

async function getItem(item_id) {
  const params = [ item_id ];
  const result = await client.execute(readQuery, params, { prepare : true });
  const row = result.first();
  return {
    statusCode: 200,
    body: JSON.stringify({
      query: readQuery,
      item_id: item_id,
      name: row.name,
      description: row.description,
      price: row.price
    })
  };
}

exports.createCatalog = async (req, res) => {
  console.log('timeuuid in createCatalog: ' + myuuid);
  const result = await createSchema();
  res.status(result.statusCode).json(result.body);
};

exports.addItem = async (req, res) => {
  console.log('timeuuid in addItem: ' + myuuid);
  const result = await addItem(req.body.item_id, req.body.name, req.body.description, req.body.price);
  res.status(result.statusCode).json(JSON.parse(result.body));
};

exports.getItem = async (req, res) => {
  console.log('timeuuid in getItem: ' + myuuid);
  const id = req.path.match(/\d+/g);
  const result = await getItem(id)
  res.status(result.statusCode).json(JSON.parse(result.body));
};
