import React, { useState, useCallback } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import './KanbanBoard.css';

const DEFAULT_DOC = {
    lists: [
        { id: 'todo', title: 'To Do', position: 0 },
        { id: 'doing', title: 'In Progress', position: 1 },
        { id: 'done', title: 'Done', position: 2 },
    ],
    cards: [
        { id: 'card-1', title: 'Welcome to Kanban!', listId: 'todo', position: 1000 },
        { id: 'card-2', title: 'Drag cards across columns', listId: 'todo', position: 2000 },
        { id: 'card-3', title: 'Click + to add new tasks', listId: 'doing', position: 3000 },
    ]
};

export default function KanbanBoard({ embedded = false }) {
    const [doc, setDoc] = useLocalStore('kanban_board_data', DEFAULT_DOC);
    const [draggedCardId, setDraggedCardId] = useState(null);

    const addCard = (listId) => {
        const title = prompt('Enter card title:');
        if (!title || !title.trim()) return;

        const newCard = {
            id: `card-${Date.now()}`,
            title: title.trim(),
            listId,
            position: Date.now()
        };

        setDoc(prev => ({
            ...prev,
            cards: [...prev.cards, newCard]
        }));
    };

    const deleteCard = (cardId) => {
        setDoc(prev => ({
            ...prev,
            cards: prev.cards.filter(c => c.id !== cardId)
        }));
    };

    const moveCard = (cardId, newListId) => {
        setDoc(prev => ({
            ...prev,
            cards: prev.cards.map(c => 
                c.id === cardId ? { ...c, listId: newListId, position: Date.now() } : c
            )
        }));
    };

    // Drag and Drop handlers
    const onDragStart = (e, cardId) => {
        setDraggedCardId(cardId);
        e.dataTransfer.setData('cardId', cardId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e, listId) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        if (cardId) {
            moveCard(cardId, listId);
        }
        setDraggedCardId(null);
    };

    const cardsByList = (listId) => {
        return doc.cards
            .filter(c => c.listId === listId)
            .sort((a, b) => a.position - b.position);
    };

    const content = (
        <div className="kanban-app">
            <div className="kanban-board">
                {doc.lists.sort((a, b) => a.position - b.position).map(list => (
                    <div 
                        key={list.id} 
                        className="kb-column"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, list.id)}
                    >
                        <div className="kb-col-header">
                            <h2 className="kb-col-title">{list.title}</h2>
                            <span className="kb-col-count">{cardsByList(list.id).length}</span>
                        </div>
                        
                        <div className="kb-cards-container">
                            {cardsByList(list.id).map(card => (
                                <div 
                                    key={card.id} 
                                    className={`kb-card ${draggedCardId === card.id ? 'dragging' : ''}`}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, card.id)}
                                >
                                    <div className="kb-card-content">{card.title}</div>
                                    <button className="kb-card-del" onClick={() => deleteCard(card.id)}>
                                        <i className="fas fa-trash-can"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button className="add-card-link" onClick={() => addCard(list.id)}>
                            <i className="fas fa-plus"></i> Add a card
                        </button>
                    </div>
                ))}
                
                <button className="add-column-btn" onClick={() => {
                    const title = prompt('Enter column title:');
                    if (title) setDoc(prev => ({
                        ...prev, 
                        lists: [...prev.lists, { id: `list-${Date.now()}`, title, position: prev.lists.length }]
                    }));
                }}>
                    <i className="fas fa-plus"></i> Add Column
                </button>
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <AppShell title="Kanban Board" icon="fas fa-columns">
            {content}
        </AppShell>
    );
}
