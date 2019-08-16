'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
var kms = new AWS.KMS();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

 
module.exports.create = (event, context, callback) => {
  const data = JSON.parse(event.body);
  var encryptedValue;
  if (typeof data.firstName !== 'string' || typeof data.lastName !== 'string' || typeof data.username !== 'string' || typeof data.email !== 'string') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create the user.',
    });
    return;
  }

  // const kmsparams = {
  //   KeyId: "8954e273-4044-46f5-bc18-a7dcbbc5101f", // The identifier of the CMK to use for encryption. You can use the key ID or Amazon Resource Name (ARN) of the CMK, or the name or ARN of an alias that refers to the CMK.
  //   Plaintext: data.credentials
  //  };
  //  kms.encrypt(kmsparams, function(err, data) {
  //    if (err) console.log(err, err.stack); // an error occurred
  //    else   {
  //      console.log("password is" + encryptedValue);
  //      encryptedValue = data;  }         // successful response
  //  });


  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuid.v1(),
      first_name: data.firstName,
      last_name: data.lastName,
      user_name: data.username,
      credentials: data.credentials,//encryptedValue.CiphertextBlob,
      email: data.email,
    },
  };

  // write the user to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t create the user.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });
};
