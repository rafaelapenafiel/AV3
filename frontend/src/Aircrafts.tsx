import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "./Modal";
import { TipoAeronave, type Aeronave, type Peca } from "./types";

const estadoInicialForm: Omit<Aeronave, "codigo"> = {
  modelo: "",
  tipo: TipoAeronave.Comercial,
  capacidade: 0,
  autonomia: 0,
};

interface OutletContextType {
  aeronaves: Aeronave[];
  setAeronaves: React.Dispatch<React.SetStateAction<Aeronave[]>>;
  pecas: Peca[];
}

async function enviarAeronave(aeronaveData: Omit<Aeronave, "codigo">) {
  try {
    const response = await fetch("http://localhost:3000/aeronave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aeronaveData),
    });

    if (response.ok) {
      alert("Aeronave cadastrada com sucesso!");
    } else {
      const data = await response.json();
      alert("Falha ao cadastrar aeronave: " + (data.error || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("Erro ao conectar com o servidor.");
  }
}

export function Aircrafts() {
  const { aeronaves, setAeronaves } = useOutletContext<OutletContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novaAeronave, setNovaAeronave] = useState<Omit<Aeronave, "codigo">>(estadoInicialForm);
  const [aeronaveSelecionada, setAeronaveSelecionada] = useState<Aeronave | null>(null);

  const carregarAeronaves = async () => {
    try {
      const response = await fetch("http://localhost:3000/aeronavesList"); 
      if (!response.ok) {
        throw new Error("Erro ao buscar aeronaves");
      }
      const dados: Aeronave[] = await response.json();
      setAeronaves(dados);
    } catch (error) {
      console.error("Erro ao carregar aeronaves:", error);
    }
  };

  useEffect(() => {
    carregarAeronaves();
    closeModal(); 
  }, []);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovaAeronave({
      ...novaAeronave,
      [name]: name === "capacidade" || name === "autonomia" ? Number(value) : value,
    });
  };

  const abrirModalEdicao = (aeronave: Aeronave) => {
    setAeronaveSelecionada(aeronave);
    setNovaAeronave({
      modelo: aeronave.modelo,
      tipo: aeronave.tipo,
      capacidade: aeronave.capacidade,
      autonomia: aeronave.autonomia,
    }); 
    setIsModalOpen(true);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (aeronaveSelecionada) {
      const updated: Aeronave = { 
        codigo: aeronaveSelecionada.codigo, 
        ...novaAeronave, 
      };

      try {
        const response = await fetch("http://localhost:3000/aeronaveEdit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (!response.ok) {
          const data = await response.json();
          alert("Falha ao editar aeronave: " + (data.error || "Erro desconhecido"));
          return;
        }

        alert("Aeronave editada com sucesso!");
        setAeronaves((prev) =>
          prev.map((a) => (a.codigo === updated.codigo ? updated : a))
        );
      } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao conectar com o servidor.");
      }
    } else {
      await enviarAeronave(novaAeronave);
      
      carregarAeronaves(); 
    }

    closeModal();
  };

  const handleDelete = async (codigo: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aeronave? Esta ação é irreversível.")) return;

    try {
      const response = await fetch("http://localhost:3000/aeronaveDelete", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      if (response.status === 200) {
        alert("Aeronave excluída com sucesso!");
        setAeronaves(aeronaves.filter((a) => a.codigo !== codigo));
      } else {
        const data = await response.json();
        alert("Falha ao excluir aeronave: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setAeronaveSelecionada(null);
    setNovaAeronave(estadoInicialForm);
  }

  return (
    <div className="main-content">
      <h1>Gerenciamento de Aeronaves</h1>

      <div className="table-actions">
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          Cadastrar Nova Aeronave
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Capacidade</th>
              <th>Autonomia (km)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {aeronaves.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">Nenhuma aeronave cadastrada.</td>
              </tr>
            ) : (
              aeronaves.map((aeronave) => (
                <tr key={aeronave.codigo}>
                  <td>{aeronave.codigo}</td>
                  <td>{aeronave.modelo}</td>
                  <td>{aeronave.tipo}</td>
                  <td>{aeronave.capacidade}</td>
                  <td>{aeronave.autonomia.toLocaleString('pt-BR')}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-secondary"
                      onClick={() => abrirModalEdicao(aeronave)}>
                      Editar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(aeronave.codigo)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={aeronaveSelecionada ? "Editar Aeronave Existente" : "Cadastrar Nova Aeronave"}
        isOpen={isModalOpen}
        onClose={closeModal}>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="modelo">Modelo</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={novaAeronave.modelo}
              onChange={handleInputChange}
              required/>
          </div>

          <div className="form-group">
            <label htmlFor="tipo">Tipo de Aeronave</label>
            <select
              id="tipo"
              name="tipo"
              value={novaAeronave.tipo}
              onChange={handleInputChange}
              required>
              {Object.values(TipoAeronave).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="capacidade">Capacidade (Passageiros/Carga)</label>
            <input
              type="number"
              id="capacidade"
              name="capacidade"
              value={novaAeronave.capacidade}
              onChange={handleInputChange}
              required
              min="1"/>
          </div>

          <div className="form-group">
            <label htmlFor="autonomia">Autonomia (km)</label>
            <input
              type="number"
              id="autonomia"
              name="autonomia"
              value={novaAeronave.autonomia}
              onChange={handleInputChange}
              required
              min="100"/>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {aeronaveSelecionada ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}