const host = "http://localhost:3000";
describe("Temp API test", () => {
  it("should call the API endpoint", async () => {
    const response: Response = await fetch(`${host}/temp-api`);
    expect(response.ok).toBe(true);
  });
});
