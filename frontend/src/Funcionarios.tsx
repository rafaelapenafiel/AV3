import { useEffect, useState } from "react";
import {
  Hierarquia,
  type Funcionario,
  type Endereco,
  type Telefone,
} from "./types";
import Modal from "./Modal";

type FuncionarioCadastroPayload = Omit<Funcionario, "id"> & {
  endereco: Omit<Endereco, "id" | "funcionarioId">;
  telefone: Omit<Telefone, "id" | "funcionarioId">;
};

const formatCPF = (cpf: string) => {
  const numericCPF = cpf.replace(/\D/g, "");
  return numericCPF
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
};

async function cadastrarFuncionario(funcionario: FuncionarioCadastroPayload) {
  try {
    const response = await fetch("http://localhost:3000/funcionario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(funcionario),
    });

    if (response.ok) {
      return await response.json();
    } else {
      const data = await response.json();
      alert(
        "Falha ao cadastrar funcionário: " + (data.error || "Erro desconhecido")
      );
      return null;
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
    return null;
  }
}

async function editarFuncionario(funcionario: Funcionario): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3000/funcionarioEdit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(funcionario),
    });

    if (response.ok) {
      return true;
    } else {
      const data = await response.json();
      alert(
        "Falha ao editar funcionário: " + (data.error || "Erro desconhecido")
      );
      return false;
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
    return false;
  }
}

async function deletarFuncionario(id: number) {
  try {
    const response = await fetch(`http://localhost:3000/funcionario/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      alert(
        "Falha ao excluir funcionário: " + (data.error || "Erro desconhecido")
      );
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
  }
}

function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingEmployee, setEditingEmployee] = useState<Funcionario | null>(
    null
  );

  const initialEmployeeState: Omit<Funcionario, "id"> = {
    nome: "",
    cpf: "",
    cargo: Hierarquia.Operador,
    login: "",
    senha: "",
  };

  const [newEmployee, setNewEmployee] = useState(initialEmployeeState);

  const initialEnderecoState: Omit<Endereco, "id" | "funcionarioId"> = {
    rua: "",
    numero: 0,
    bairro: "",
    cidade: "",
  };

  const [newEndereco, setNewEndereco] = useState(initialEnderecoState);

  const initialTelefoneState: Omit<Telefone, "id" | "funcionarioId"> = {
    ddd: "",
    numero: "",
  };

  const [newTelefone, setNewTelefone] = useState(initialTelefoneState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (step === 1) {
      setNewEmployee((prev) => ({
        ...prev,
        [name]: name === "cpf" ? formatCPF(value) : value,
      }));
    }

    if (step === 2)
      setNewEndereco((prev) => ({
        ...prev,
        [name]: name === "numero" ? parseInt(value) : value,
      }));

    if (step === 3)
      setNewTelefone((prev) => ({
        ...prev,
        [name]: value,
      }));
  };

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      const updatedEmployee = {
        ...editingEmployee,
        ...newEmployee,
        endereco: newEndereco,
        telefone: newTelefone,
      };

      const success = await editarFuncionario(updatedEmployee as Funcionario);

      if (success) {
        setFuncionarios((prev) =>
          prev.map((f) => (f.id === editingEmployee.id ? updatedEmployee : f))
        );
        setIsModalOpen(false);
        setEditingEmployee(null);
      }
    } else {
      const completeEmployeeData: FuncionarioCadastroPayload = {
        ...newEmployee,
        endereco: newEndereco,
        telefone: newTelefone,
      };

      const created = await cadastrarFuncionario(completeEmployeeData);

      if (created) {
        setFuncionarios((prev) => [...prev, created]);
        setIsModalOpen(false);
      }
    }

    setNewEmployee(initialEmployeeState);
    setNewEndereco(initialEnderecoState);
    setNewTelefone(initialTelefoneState);
    setStep(1);
  };

  const carregarPeças = async () => {
    try {
      const response = await fetch("http://localhost:3000/funcionariosList");
      if (!response.ok) {
        throw new Error("Erro ao buscar peças");
      }
      const dados: Funcionario[] = await response.json();
      setFuncionarios(dados);
    } catch (error) {
      console.error("Erro ao carregar aeronaves:", error);
    }
  };

  useEffect(() => {
    carregarPeças();
  }, []);

  const openModal = async (funcionario?: Funcionario) => {
    if (funcionario) {
      const response = await fetch(
        `http://localhost:3000/funcionario/${funcionario.id}`
      );
      const data = await response.json();

      if (!data || data.error) {
        alert("Erro ao carregar dados do funcionário.");
        return;
      }

      setEditingEmployee(data);

      setNewEmployee({
        nome: data.nome ?? "",
        cpf: data.cpf ?? "",
        cargo: data.cargo ?? Hierarquia.Operador,
        login: data.login ?? "",
        senha: data.senha ?? "",
      });

      setNewEndereco({
        rua: data.endereco?.rua ?? "",
        numero: data.endereco?.numero ?? 0,
        bairro: data.endereco?.bairro ?? "",
        cidade: data.endereco?.cidade ?? "",
      });

      setNewTelefone({
        ddd: data.telefone?.ddd ?? "",
        numero: data.telefone?.numero ?? "",
      });
    } else {
      setEditingEmployee(null);
      setNewEmployee(initialEmployeeState);
      setNewEndereco(initialEnderecoState);
      setNewTelefone(initialTelefoneState);
    }

    setStep(1);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      setFuncionarios(funcionarios.filter((f) => f.id !== id));
      deletarFuncionario(id);
    }
  };

  return (
    <div>
      <h1>Gerenciamento de Funcionários</h1>

      <Modal
        title={editingEmployee ? "Editar Funcionário" : "Cadastrar Funcionário"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  name="nome"
                  value={newEmployee.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={newEmployee.cpf}
                  onChange={handleInputChange}
                  required
                  maxLength={14} 
                />
              </div>

              <div className="form-group">
                <label>Cargo</label>
                <select
                  name="cargo"
                  value={newEmployee.cargo}
                  onChange={handleInputChange}
                >
                  {Object.values(Hierarquia).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Login</label>
                <input
                  type="email"
                  name="login"
                  value={newEmployee.login}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  name="senha"
                  value={newEmployee.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Rua</label>
                <input
                  type="text"
                  name="rua"
                  value={newEndereco.rua}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Número</label>
                <input
                  type="number"
                  name="numero"
                  value={newEndereco.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={newEndereco.bairro}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={newEndereco.cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>DDD</label>
                <input
                  type="text"
                  name="ddd"
                  value={newTelefone.ddd}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Número</label>
                <input
                  type="text"
                  name="numero"
                  value={newTelefone.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-navigation">
            {step > 1 && (
              <button type="button" onClick={handlePreviousStep}>
                Anterior
              </button>
            )}

            {step < 3 && (
              <button type="button" onClick={handleNextStep}>
                Próximo
              </button>
            )}

            {step === 3 && <button type="submit">Salvar</button>}
          </div>
        </form>
      </Modal>

      <div className="card">
        <div className="table-actions">
          <button className="btn-primary" onClick={() => openModal()}>
            Cadastrar Novo Funcionário
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Cargo</th>
              <th>Login</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>{f.nome}</td>
                <td>{f.cpf}</td>
                <td>{f.cargo}</td>
                <td>{f.login}</td>

                <td className="actions-cell">
                  <button
                    className="btn-secondary"
                    onClick={() => openModal(f)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(f.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Funcionarios;
