import request from 'supertest';
import app from '../../index';
import CustomerRepository from '@domain/customer/repository/CustomerRepository';
import axios from 'axios';
import {
  mCpfEqualCustomer,
  mCpfInvalidCustomer,
  mCpfRepeatedCustomer,
  mEmailRepeatedCustomer,
  mockDatabase,
  mockValidCustomer,
  mPCodeInvalidCustomer,
} from './mocks/CustomerRouter.mock';
import { ICustomer } from '@interfaces/domain/customer/repository';

const spyRepository = {
  readAll: jest.spyOn(CustomerRepository.prototype, 'readAll'),
  create: jest.spyOn(CustomerRepository.prototype, 'create'),
};

beforeEach(() => {
  spyRepository.readAll.mockReset();
  spyRepository.create.mockClear();
  spyRepository.readAll.mockImplementation(async () => []);
});

describe('Route /customer', () => {
  describe('GET /customer', () => {
    const expectedResults: Record<string, object | string> = {
      listJson: {
        0: {
          email: mEmailRepeatedCustomer.email,
          cpf: mCpfRepeatedCustomer.cpf,
        },
      },
      getError: 'Error: Failed to readAll database',
    };

    it('Should return all customers when reading works correctly', async () => {
      spyRepository.readAll.mockImplementation(async () => {
        return mockDatabase;
      });
      const res = await request(app).get('/customer');
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(200);
      expect(res.body.message).toEqual(expectedResults.listJson);
    });

    it('Should return reading error when readAll fails', async () => {
      spyRepository.readAll.mockImplementationOnce(async () => {
        throw new Error('');
      });
      const res = await request(app).get('/customer');
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(500);
      expect(res.body.error).toEqual(expectedResults.getError);
    });
  });

  describe('POST /customer', () => {
    const expectedResults: Record<string, ICustomer | string> = {
      newCustomer: {
        ...mockValidCustomer,
        cpf: '12345678909',
        cellphone: '47991234567',
        birthdate: '2000-01-01T00:00:00.000Z',
        postal_code: '89010203',
      },
      repeatedCpf: '19087282052',
      repeatedEmail: 'repeated@repeated.com',
      equalCpf: '11111111111',
      invalidCpf: '10897799900',
      invalidPostalCode: '01010101',
    };

    const missingCases: (keyof ICustomer)[] = [
      'address',
      'postal_code',
      'city',
      'country',
      'whatsapp',
      'email_sms',
      'birthdate',
      'cellphone',
      'cpf',
      'email_confirmation',
      'email',
      'full_name',
    ];

    spyRepository.readAll.mockImplementation(() => {
      return mockDatabase;
    });

    it('Should respond with sanitized user json when creating valid user', async () => {
      spyRepository.create.mockImplementation(() => mockValidCustomer);
      const res = await request(app).post('/customer').send(mockValidCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(201);
      expect(res.body.message).toEqual(expectedResults.newCustomer);
    });

    it('Should respond with error when cpf already exists', async () => {
      spyRepository.create.mockImplementation(() => mCpfRepeatedCustomer);
      const res = await request(app)
        .post('/customer')
        .send(mCpfRepeatedCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(422);
      expect(res.body.error).toEqual(
        `Error: CPF ${expectedResults.repeatedCpf} already exists`,
      );
    });

    it('Should respond with error when email already exists', async () => {
      spyRepository.create.mockImplementation(() => mEmailRepeatedCustomer);
      const res = await request(app)
        .post('/customer')
        .send(mEmailRepeatedCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(422);
      expect(res.body.error).toEqual(
        `Error: Email ${expectedResults.repeatedEmail} already exists`,
      );
    });

    it('Should respond with error when user cpf is composed only with one number', async () => {
      spyRepository.create.mockImplementation(() => mCpfEqualCustomer);
      const res = await request(app).post('/customer').send(mCpfEqualCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(422);
      expect(res.body.error).toEqual(
        `Error: CPF ${expectedResults.equalCpf} is invalid`,
      );
    });

    it('Should respond with error when user cpf is invalid', async () => {
      spyRepository.create.mockImplementation(() => mCpfInvalidCustomer);
      const res = await request(app)
        .post('/customer')
        .send(mCpfInvalidCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(422);
      expect(res.body.error).toEqual(
        `Error: CPF ${expectedResults.invalidCpf} is invalid`,
      );
    });

    it('Should respond with error when user postal code is invalid', async () => {
      spyRepository.create.mockImplementation(() => mPCodeInvalidCustomer);
      jest.spyOn(axios, 'get').mockImplementation(() => Promise.reject());
      const res = await request(app)
        .post('/customer')
        .send(mPCodeInvalidCustomer);
      expect(res).not.toBeUndefined();
      expect(res.status).toBe(422);
      expect(res.body.error).toEqual(
        `Error: Postal Code ${expectedResults.invalidPostalCode} is invalid`,
      );
    });

    it.each(missingCases)(
      'Should respond with error when %p is missing in new user',
      async (firstParam) => {
        jest
          .spyOn(CustomerRepository.prototype, 'create')
          .mockImplementation(() => mockValidCustomer);
        (mockValidCustomer[firstParam] as unknown) = undefined;
        const res = await request(app)
          .post('/customer')
          .send(mockValidCustomer);
        expect(res).not.toBeUndefined();
        expect(res.status).toBe(422);
      },
    );
  });
});
