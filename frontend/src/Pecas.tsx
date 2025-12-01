import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  tipoPeca,
  statusPeca,
  type Peca,
  type Aeronave,
  type Etapa,
} from "./types";
import Modal from "./Modal";

interface OutletContextType {
  pecas: Peca[];
  setPecas: React.Dispatch<React.SetStateAction<Peca[]>>;
  aeronaves: Aeronave[];
  etapas: Etapa[];
  setEtapas: React.Dispatch<React.SetStateAction<Etapa[]>>;
}

async function enviarpeca(peca: Peca) {
  try {
    const response = await fetch("http://localhost:3000/peca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(peca),
    });

    if (response.ok) {
      alert("Peça cadastrada com sucesso!");
    } else {
      const data = await response.json();
      alert("Falha ao cadastrar peça: " + (data.error || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("Erro ao conectar com o servidor.");
  }
}

function Pecas() {
  const { pecas, setPecas, aeronaves } = useOutletContext<OutletContextType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);

  const initialPecaState: Peca = {
    id: 0,
    nome: "",
    tipo: tipoPeca.Nacional,
    fornecedor: "",
    status: statusPeca.Producao,
    aeronaveId: aeronaves[0]?.codigo || 0,
  };
  const [currentPeca, setCurrentPeca] = useState<Peca>(initialPecaState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentPeca((prev) => ({
      ...prev,
      [name]: name === "aeronaveId" ? parseInt(value, 10) : value,
    }));
  };

  const carregarPeças= async () => {
    try {
      const response = await fetch("http://localhost:3000/pecasList"); 
      if (!response.ok) {
        throw new Error("Erro ao buscar peças");
      }
      const dados: Peca[] = await response.json();
      setPecas(dados);
    } catch (error) {
      console.error("Erro ao carregar aeronaves:", error);
    }
  };

  useEffect(() => {
    carregarPeças();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPeca) {
      console.log(currentPeca);
      try {
        const response = await fetch("http://localhost:3000/pecaEdit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentPeca),
        });

        if (!response.ok) {
          const data = await response.json();
          alert("Falha ao editar peça: " + (data.error || "Erro desconhecido"));
          return;
        }

        setPecas((prev) =>
          prev.map((p) => (p.id === editingPeca.id ? currentPeca : p))
        );

        alert("Peça editada com sucesso!");
      } catch (error) {
        console.error("Erro ao editar peça:", error);
        alert("Erro ao conectar com o servidor.");
      }
    } else {
      const newEntry: Peca = {
        ...currentPeca,
        id: Math.floor(Math.random() * 10000) + 100,
      };
      setPecas((prev) => [...prev, newEntry]);
      enviarpeca(newEntry);
    }

    setIsModalOpen(false);
    setEditingPeca(null);
    setCurrentPeca(initialPecaState);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta peça?")) {
      setPecas(pecas.filter((p) => p.id !== id));
      try {
        const response = await fetch("http://localhost:3000/pecaDelete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.status === 200) {
          alert("Peça excluída com sucesso!");
        } else {
          const data = await response.json();
          alert(
            "Falha ao excluir peça: " + (data.error || "Erro desconhecido")
          );
        }
      } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao conectar com o servidor.");
      }
    }
  };

  const openModal = () => {
    setEditingPeca(null);
    setCurrentPeca(initialPecaState);
    setIsModalOpen(true);
  };

  const handleEdit = (peca: Peca) => {
    setEditingPeca(peca);
    setCurrentPeca(peca);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPeca(null);
    setCurrentPeca(initialPecaState);
  };

  return (
    <div>
      <h1>Gerenciamento de Peças</h1>

      <Modal
        title={editingPeca ? "Editar Peça" : "Cadastrar Nova Peça"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome da Peça</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={currentPeca.nome}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              name="tipo"
              value={currentPeca.tipo}
              onChange={handleInputChange}
            >
              {Object.values(tipoPeca).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fornecedor">Fornecedor</label>
            <input
              type="text"
              id="fornecedor"
              name="fornecedor"
              value={currentPeca.fornecedor}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="aeronaveId">Aeronave Associada</label>
            <select
              id="aeronaveId"
              name="aeronaveId"
              value={currentPeca.aeronaveId}
              onChange={handleInputChange}
              disabled={aeronaves.length === 0}
            >
              {aeronaves.map((a) => (
                <option key={a.codigo} value={a.codigo}>
                  {a.modelo} ({a.codigo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={currentPeca.status}
              onChange={handleInputChange}
              disabled={currentPeca.status === statusPeca.Pronta}
            >
              {Object.values(statusPeca).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Salvar
          </button>
        </form>
      </Modal>

      <div className="card">
        <div className="table-actions">
          <button className="btn-primary" onClick={openModal}>
            Cadastrar Nova Peça
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Fornecedor</th>
              <th>Status</th>
              <th>Aeronave ID</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
  {pecas.map((p) => (
    <tr key={p.id}>
      <td>{p.id}</td>
      <td>{p.nome}</td>
      <td>{p.tipo}</td>
      <td>{p.fornecedor}</td>
      <td>{p.status}</td> 
      <td>{p.aeronaveId}</td>
      <td className="actions-cell">
        <button
          className="btn-secondary"
          onClick={() => handleEdit(p)}>
          Editar
        </button>
        <button
          className="btn-danger"
          onClick={() => handleDelete(p.id)}>
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

export default Pecas;
