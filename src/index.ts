import express, { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

interface Customer {
  cpf: string;
  name: string;
  id: string;
  statement: statementOperation[];
  balance: number;
}

interface CustomRequest extends Request {
  customer?: Customer;
}

interface statementOperation {
  description?: string;
  amount: number;
  created_at: Date;
  type: "credit" | "debit";
}

let customers: Customer[] = [];

function verifyIfExistsAccountCPF(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found!" });
  }
  req.customer = customer;

  return next();
}

function getBalance(statement?: statementOperation[]) {
  return statement?.reduce((acc, operation) => {
    return operation.type === "credit"
      ? acc + operation.amount
      : acc - operation.amount;
  }, 0);
}

app.get("/customers", (req: Request, res: Response) => {
  if (customers.length === 0) {
    return res.status(404).json({ error: "There are no customers yet" });
  }
  return res.json(customers);
});

app.get(
  "/statement",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { customer } = req;

    return res.json(customer?.statement);
  }
);

app.get(
  "/statement/date",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { customer } = req;
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "Date is required in query params!" });
    }

    const dateFormat = new Date(date + " 00:00");
    if (isNaN(dateFormat.getTime())) {
      return res.status(400).json({ error: "Invalid date format!" });
    }

    const statement = customer?.statement.filter((statement) => {
      const operationDate = new Date(statement.created_at).toDateString();
      return operationDate === dateFormat.toDateString();
    });

    return res.json(statement);
  }
);

app.post("/account", (req: Request, res: Response) => {
  const { cpf, name } = req.body;
  let index = 0;

  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [], balance: 0 });

  return res.status(201).send();
});

app.post(
  "/deposit",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const operation: statementOperation = {
      description: description,
      amount: amount,
      created_at: new Date(),
      type: "credit",
    };

    customer?.statement.push(operation);
    if (customer) {
      customer.balance += amount;
    }
    return res.status(201).send();
  }
);

app.post(
  "/withdraw",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { amount } = req.body;
    const { customer } = req;
    const balance = getBalance(customer?.statement) || 0;

    if (balance < amount) {
      return res.status(400).json({ error: "Insuficient funds!" });
    }

    const operation: statementOperation = {
      amount: amount,
      created_at: new Date(),
      type: "debit",
    };

    customer?.statement.push(operation);
    if (customer) {
      customer.balance = balance;
    }
    return res.status(201).send();
  }
);

app.put(
  "/account",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { name } = req.body;
    const { customer } = req;

    if (customer) customer.name = name;
    return res.status(201).send();
  }
);

app.delete(
  "/account",
  verifyIfExistsAccountCPF,
  (req: CustomRequest, res: Response) => {
    const { customer } = req;

    customers = customers.filter((c) => c.id !== customer?.id);
    return res.status(200).json(customers);
  }
);

app.listen(3333, () => console.log("🚀 Server is running"));
