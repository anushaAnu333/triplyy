declare module 'supertest' {
  import { Application } from 'express';
  function request(app: Application): supertest.SuperTest<supertest.Test>;
  namespace supertest {
    interface Test {
      expect(status: number): this;
      send(data: object): this;
      query(params: object): this;
      set(field: string, value: string): this;
      then<T>(onfulfilled?: (value: { body: any; status: number }) => T | PromiseLike<T>): Promise<T>;
      catch(onrejected?: (reason: any) => any): Promise<{ body: any; status: number }>;
      body: any;
      status: number;
    }
    interface SuperTest<T> {
      get(url: string): T;
      post(url: string): T;
      put(url: string): T;
      patch(url: string): T;
      delete(url: string): T;
    }
  }
  export = request;
}
