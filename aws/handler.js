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
  // For this reason, we disable it below.
  pooling: { heartBeatInterval: 0 }

  // If trying to reduce Cold Start time, the driver's automatic metadata synchronization and pool warmup can be disabled 
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

module.exports.createCatalog = async (event) => {
  console.log('timeuuid in createCatalog: ' + myuuid);
  return createSchema();
};

module.exports.addItem = async (event) => {
  console.log('timeuuid in addItem: ' + myuuid);
  const data = JSON.parse(event.body);
  return addItem(data.item_id, data.name, data.description, data.price);
};

module.exports.getItem = async (event) => {
  console.log('timeuuid in getItem: ' + myuuid);
  return getItem(event.pathParameters.id);
};