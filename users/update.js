'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

var kms = new AWS.KMS();

module.exports.update = (event, context, callback) => {
  const data = JSON.parse(event.body);
  var encryptedValue;

  // validation
  if (typeof data.firstName !== 'string' || typeof data.lastName !== 'string' || typeof data.username !== 'string' || typeof data.email !== 'string') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t update the user.',
    });
    return;
  }
  const kmsparams = {
    KeyId: "8954e273-4044-46f5-bc18-a7dcbbc5101f", // The identifier of the CMK to use for encryption. You can use the key ID or Amazon Resource Name (ARN) of the CMK, or the name or ARN of an alias that refers to the CMK.
    Plaintext: data.credentials
   };
   kms.encrypt(kmsparams, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else   {
       console.log(encryptedValue);
       encryptedValue = data;  }         // successful response
   });

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeNames: {
      '#first_name': 'firstName',
      '#last_name': 'lastName',
      '#user_name': 'username',
    },
    ExpressionAttributeValues: {
      ':firstName': data.firstName,
      ':lastName': data.lastName,
      ':username': data.username,
      ':email': data.email,
      ':credentials': encryptedValue,
    },
    UpdateExpression: 'SET #first_name = :firstName, last_name = :lastName, username = :username, email =:email, credentials =:credentials',
    ReturnValues: 'ALL_NEW',
  };

  // update the user in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the user.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
    callback(null, response);
  });
};
