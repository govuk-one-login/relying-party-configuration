import { CLIENT_DEFAULTS, createClient } from "../src/models/client";
import { ClientServiceError } from "../src/services/client-service";
import { it } from "./base";

describe("Client service integration test", async () => {
  const TEST_TIMESTAMP = 1234567890;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TEST_TIMESTAMP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Get client by ID tests", () => {
    it("should get client by ID", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient = createClient({
        clientId: "test-client-id",
      });
      await addClientsToDynamo(testClient);

      const actualClient = await clientService.getClient("test-client-id");

      expect(actualClient).toEqual(testClient);
    });

    it("should not get client if client does not exist with ID", async ({
      clientService,
    }) => {
      const actualClient = await clientService.getClient("test-client-id");

      expect(actualClient).toBeUndefined();
    });
  });

  describe("Get client summaries", () => {
    it("should get first page of client summaries (less clients than page size)", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient = createClient({
        clientId: "test-client-id",
      });
      await addClientsToDynamo(testClient);

      const actualClients = await clientService.getClientSummaries(1, 5);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 1,
        clients: [
          { clientId: testClient.clientId, clientName: testClient.clientName },
        ],
      });
    });

    it("should get first page of client summaries (more clients than page size)", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient1 = createClient({ clientId: "test-client-id-1" });
      const testClient2 = createClient({ clientId: "test-client-id-2" });
      const testClient3 = createClient({ clientId: "test-client-id-3" });
      await addClientsToDynamo(testClient1, testClient2, testClient3);

      const actualClients = await clientService.getClientSummaries(1, 2);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            clientId: testClient2.clientId,
            clientName: testClient2.clientName,
          },
          {
            clientId: testClient1.clientId,
            clientName: testClient1.clientName,
          },
        ],
      });
    });

    it("should get second page of client summaries (more clients than page size)", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient1 = createClient({ clientId: "test-client-id-1" });
      const testClient2 = createClient({ clientId: "test-client-id-2" });
      const testClient3 = createClient({ clientId: "test-client-id-3" });
      await addClientsToDynamo(testClient1, testClient2, testClient3);

      const actualClients = await clientService.getClientSummaries(2, 2);

      expect(actualClients).toEqual({
        pageNumber: 2,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            clientId: testClient3.clientId,
            clientName: testClient3.clientName,
          },
        ],
      });
    });

    it("should get no client summaries (no clients exist)", async ({
      clientService,
    }) => {
      const actualClients = await clientService.getClientSummaries(1, 5);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 0,
        clients: [],
      });
    });
  });

  describe("Create client", () => {
    it("should create client", async ({
      getClientFromDynamo,
      clientService,
    }) => {
      const clientToCreate = createClient();
      const testClient = await clientService.putClient(clientToCreate);

      expect(await getClientFromDynamo(testClient.clientId)).toEqual(
        testClient,
      );
    });

    it("should fail to create client if client already exists", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      await addClientsToDynamo({
        ...CLIENT_DEFAULTS,
        clientId: "test-client-id",
        created: 1234567,
        lastModified: 1234567,
      });

      const clientToCreate = createClient({
        clientId: "test-client-id",
      });
      await expect(() =>
        clientService.putClient(clientToCreate),
      ).rejects.toThrow(ClientServiceError);
    });
  });

  describe("Update client", () => {
    it("should update existing client", async ({
      addClientsToDynamo,
      getClientFromDynamo,
      clientService,
    }) => {
      const testClient = createClient({ clientId: "test-client-id" });
      await addClientsToDynamo(testClient);

      await clientService.updateClient({
        ...testClient,
        scopes: ["openid", "phone", "email"],
      });

      expect(await getClientFromDynamo("test-client-id")).toEqual({
        ...testClient,
        scopes: ["openid", "phone", "email"],
        lastModified: 1234567,
      });
    });

    it("should fail to update client if client does not exist", async ({
      clientService,
    }) => {
      const testClient = createClient({ clientId: "test-client-id" });

      await expect(() =>
        clientService.updateClient(testClient),
      ).rejects.toThrow(ClientServiceError);
    });
  });
});
