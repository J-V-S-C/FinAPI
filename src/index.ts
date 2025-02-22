import { error } from "console";
import express, { Request, response, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

interface Customer {
  cpf: string;
  name: string;
  id: string;
  statement: any[];
}

let customers: Customer[] = [];

app.get("/account", (req: Request, res: Response) => {
  const { cpf } = req.query;
  if (cpf) {
    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found!" });
    }
    return res.status(200).json(customer);
  }

  if (customers.length === 0)
    return res
      .status(404)
      .json({ message: "There are no customers registered" });

  return res.status(200).json(customers);
});

app.post("/account", (req: Request, res: Response) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [] });

  return res.status(201).send();
});

app.put("/account/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, cpf } = req.body;
  const customer = customers.find((customer) => customer.id === id);

  if (!customer) {
    return res.status(404).json({ error: "Customer not found!" });
  }

  customer.name = name;
  customer.cpf = cpf;

  return res.status(201).json({ message: "Customer updated with success!" });
});

app.delete("/account/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const customer = customers.find((customer) => customer.id === id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found!" });
  }
  customers = customers.filter((customer) => customer.id !== id);

  return res.status(201).json({ message: "There are no customers registered" });
});

app.listen(3333, () => console.log("🚀 Server is running"));
