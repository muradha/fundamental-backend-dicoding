require('dotenv').config();

const Hapi = require('@hapi/hapi');
const notes = require('./api/notes');
const NotesValidator = require('./validator/notes');
const UsersService = require('./services/postgres/UsersService');
const NotesService = require('./services/postgres/NotesService');
const users = require('./api/users');
const UsersValidator = require('./validator/users');
const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const notesServices = new NotesService();
  const userServices = new UsersService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: notes,
      options: {
        service: notesServices,
        validator: NotesValidator,
      },
    }, {
      plugin: users,
      options: {
        service: userServices,
        validator: UsersValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();

  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
