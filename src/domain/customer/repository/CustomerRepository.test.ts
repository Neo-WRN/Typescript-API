import container from '@di/index';
import { ICustomer } from '@interfaces/domain/customer/repository';
import CustomerRepository from './CustomerRepository';

process.env.url = process.env.MONGO_URL;
const userRepository = container.resolve(CustomerRepository);
const mockCustomer = {} as ICustomer;
const mockDatabaseArr = [
  {} as ICustomer,
  { cpf: 1, email: '1' } as unknown as ICustomer,
  { cpf: 2, email: '2' } as unknown as ICustomer,
];
const mockCustomerUpdated = { email: 'test@test.com' } as unknown as ICustomer;

beforeEach(async () => {
  await userRepository.dbClient
    .getInstance()
    .collection('Customer')
    .deleteMany({});
});

afterAll(async () => {
  await userRepository.dbClient.close();
});

describe('CustomerRepository', () => {
  describe('create', () => {
    it('Should return new user when running the create method', () => {
      expect(userRepository.create(mockCustomer)).toEqual(mockCustomer);
    });
  });

  describe('read', () => {
    it('Should return the matching index user when index exists', () => {
      mockDatabaseGet.mockReturnValueOnce(
        new Map<number, ICustomer>().set(0, mockCustomer),
      );
      expect(userRepository.read(0)).toEqual(mockCustomer);
    });

    it('Should return undefined when getting an absent index', () => {
      expect(userRepository.read(0)).toEqual(undefined);
    });
  });
  describe('readAll', () => {
    it("Should return empty database when userRepository's database is empty", () => {
      expect(userRepository.readAll()).toBe(userRepository.database);
    });

    it("Should return filled database when userRepository's database is filled", () => {
      mockDatabaseGet.mockReturnValue(
        new Map<number, ICustomer>()
          .set(0, mockCustomer)
          .set(1, mockCustomer)
          .set(2, mockCustomer),
      );
      expect(userRepository.readAll()).toBe(userRepository.database);
    });
  });

  describe('update', () => {
    it('Should return updated user when updating user', () => {
      mockDatabaseGet.mockReturnValue(
        new Map<number, ICustomer>().set(0, mockCustomer),
      );
      expect(userRepository.update(0, mockCustomerUpdated)).toBe(
        mockCustomerUpdated,
      );
    });
  });

  describe('delete', () => {
    it('Should return true when deleting an entry that exists', () => {
      mockDatabaseGet.mockReturnValue(
        new Map<number, ICustomer>().set(0, mockCustomer),
      );
      expect(userRepository.delete(0)).toBe(true);
    });

    it("Should return false when deleting an entry that doesn't exists", () => {
      expect(userRepository.delete(0)).toBe(false);
    });
  });
});
