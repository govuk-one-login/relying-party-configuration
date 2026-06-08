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
        ClientID: "test-client-id",
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
        ClientID: "test-client-id",
      });
      await addClientsToDynamo(testClient);

      const actualClients = await clientService.getClientSummaries(1, 5);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 1,
        clients: [
          { ClientID: testClient.ClientID, ClientName: testClient.ClientName },
        ],
      });
    });

    it("should get first page of client summaries (more clients than page size)", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient1 = createClient({ ClientID: "test-client-id-1" });
      const testClient2 = createClient({ ClientID: "test-client-id-2" });
      const testClient3 = createClient({ ClientID: "test-client-id-3" });
      await addClientsToDynamo(testClient1, testClient2, testClient3);

      const actualClients = await clientService.getClientSummaries(1, 2);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            ClientID: testClient2.ClientID,
            ClientName: testClient2.ClientName,
          },
          {
            ClientID: testClient1.ClientID,
            ClientName: testClient1.ClientName,
          },
        ],
      });
    });

    it("should get second page of client summaries (more clients than page size)", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      const testClient1 = createClient({ ClientID: "test-client-id-1" });
      const testClient2 = createClient({ ClientID: "test-client-id-2" });
      const testClient3 = createClient({ ClientID: "test-client-id-3" });
      await addClientsToDynamo(testClient1, testClient2, testClient3);

      const actualClients = await clientService.getClientSummaries(2, 2);

      expect(actualClients).toEqual({
        pageNumber: 2,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            ClientID: testClient3.ClientID,
            ClientName: testClient3.ClientName,
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

      expect(await getClientFromDynamo(testClient.ClientID)).toEqual(
        testClient,
      );
    });

    it("should fail to create client if client already exists", async ({
      addClientsToDynamo,
      clientService,
    }) => {
      await addClientsToDynamo({
        ...CLIENT_DEFAULTS,
        ClientID: "test-client-id",
        Created: 1234567,
        LastModified: 1234567,
      });

      const clientToCreate = createClient({
        ClientID: "test-client-id",
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
      const testClient = createClient({ ClientID: "test-client-id" });
      await addClientsToDynamo(testClient);

      await clientService.updateClient({
        ...testClient,
        Scopes: ["openid", "phone", "email"],
      });

      expect(await getClientFromDynamo("test-client-id")).toEqual({
        ...testClient,
        Scopes: ["openid", "phone", "email"],
        LastModified: 1234567,
      });
    });

    it("should fail to update client if client does not exist", async ({
      clientService,
    }) => {
      const testClient = createClient({ ClientID: "test-client-id" });

      await expect(() =>
        clientService.updateClient(testClient),
      ).rejects.toThrow(ClientServiceError);
    });
  });
});
