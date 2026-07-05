import { Params } from 'nestjs-pino';

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

    autoLogging: true,

    customProps: () => ({
      application: 'LMS Backend',
    }),

    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          ip: req.ip,
        };
      },

      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },
};