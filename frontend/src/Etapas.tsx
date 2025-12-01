import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "./Modal";

enum producao {
  Pendente = "Pendente",
  Em_andamento = "Em_andamento",
  Concluido = "Concluido",
}

interface FuncionarioMin {
  id: number;
  nome: string;
  cargo: string;
}

interface Etapa {
  id: number;
  nome: string;
  dataPrevista: string;
  status: producao;
  aeronaveId: number;
  funcionarios?: {
    funcionarioId: number;
    funcionario?: { nome: string };
  }[];
}

interface Aeronave {
  codigo: number;
  modelo: string;
}

interface OutletContextType {
  etapas: Etapa[];
  setEtapas: React.Dispatch<React.SetStateAction<Etapa[]>>;
  aeronaves: Aeronave[];
}

function Etapas() {
  const { etapas, setEtapas, aeronaves } = useOutletContext<OutletContextType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [currentEtapa, setCurrentEtapa] = useState<Etapa>({
    id: 0,
    nome: "",
    dataPrevista: "",
    status: producao.Pendente,
    aeronaveId: aeronaves[0]?.codigo || 0,
    funcionarios: [],
  });
  const [funcionariosList, setFuncionariosList] = useState<FuncionarioMin[]>([]);
  const [selectedFuncionarioIds, setSelectedFuncionarioIds] = useState<number[]>([]);

  const fetchFuncionarios = async () => {
    try {
      const res = await fetch("http://localhost:3000/funcionariosListAll");
      if (res.ok) setFuncionariosList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEtapas = async () => {
    try {
      const res = await fetch("http://localhost:3000/etapasList");
      if (res.ok) {
        const data = await res.json();
        setEtapas(
          data.map((e: Etapa) => ({ ...e, dataPrevista: e.dataPrevista.split("T")[0] }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
    fetchEtapas();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentEtapa((prev) => ({
      ...prev,
      [name]: name === "aeronaveId" ? parseInt(value, 10) : value,
    }));
  };

  const handleSelectFuncionarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ids = Array.from(e.target.selectedOptions, (o) => Number(o.value));
    setSelectedFuncionarioIds(ids);
  };

  const openModal = () => {
    setEditingEtapa(null);
    setCurrentEtapa({
      id: 0,
      nome: "",
      dataPrevista: "",
      status: producao.Pendente,
      aeronaveId: aeronaves[0]?.codigo || 0,
      funcionarios: [],
    });
    setSelectedFuncionarioIds([]);
    setIsModalOpen(true);
  };

  const handleEdit = (etapa: Etapa) => {
    setEditingEtapa(etapa);
    setCurrentEtapa(etapa);
    setSelectedFuncionarioIds(etapa.funcionarios?.map(f => f.funcionarioId) || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja excluir esta etapa?")) return;
    try {
      const res = await fetch(`http://localhost:3000/etapaDelete/${id}`, { method: "DELETE" });
      if (res.ok) setEtapas(etapas.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...currentEtapa,
      funcionarioIds: selectedFuncionarioIds,
    };

    const url = editingEtapa ? "http://localhost:3000/etapaEdit" : "http://localhost:3000/etapa";
    const method = editingEtapa ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) fetchEtapas();
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
    setEditingEtapa(null);
    setSelectedFuncionarioIds([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEtapa(null);
    setSelectedFuncionarioIds([]);
  };

  const formatarData = (iso: string) => iso.split("-").reverse().join("/");

  const isConcluido = editingEtapa?.status === producao.Concluido;

  return (
    <div>
      <h1>Gerenciamento de Etapas</h1>

      <div className="table-actions mb-4">
        <button className="btn-primary" onClick={openModal}>
          Criar Etapa
        </button>
      </div>

      <Modal
        title={editingEtapa ? "Editar Etapa" : "Criar Nova Etapa"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome da Etapa</label>
            <input
              name="nome"
              value={currentEtapa.nome}
              onChange={handleInputChange}
              required
              disabled={isConcluido}
            />
          </div>

          <div className="form-group">
            <label>Data Prevista</label>
            <input
              type="date"
              name="dataPrevista"
              value={currentEtapa.dataPrevista}
              onChange={handleInputChange}
              required
              disabled={isConcluido}
            />
          </div>

          <div className="form-group">
            <label>Aeronave</label>
            <select
              name="aeronaveId"
              value={currentEtapa.aeronaveId}
              onChange={handleInputChange}
              disabled={isConcluido}
            >
              {aeronaves.map((a) => (
                <option key={a.codigo} value={a.codigo}>
                  {a.modelo} ({a.codigo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Funcionários</label>
            <select
              multiple
              value={selectedFuncionarioIds.map(String)}
              onChange={handleSelectFuncionarioChange}
              disabled={isConcluido}
            >
              {funcionariosList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.cargo})
                </option>
              ))}
            </select>
          </div>

          {editingEtapa && (
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={currentEtapa.status}
                onChange={handleInputChange}
                disabled={isConcluido}
              >
                {Object.values(producao).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {isConcluido && (
                <small className="text-red-500">
                  Etapa concluída não pode ter o status alterado.
                </small>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isConcluido}>
            Salvar
          </button>
        </form>
      </Modal>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Data Prevista</th>
              <th>Status</th>
              <th>Aeronave</th>
              <th>Funcionários</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {etapas.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.nome}</td>
                <td>{formatarData(e.dataPrevista)}</td>
                <td>{e.status}</td>
                <td>{e.aeronaveId}</td>
                <td>{(e.funcionarios?.map(f => f.funcionario?.nome).filter(Boolean).join(", ")) || "Nenhum"}</td>
                <td>
                  <button className="btn-secondary" onClick={() => handleEdit(e)}>
                    Editar
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(e.id)}>
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

export default Etapas;
