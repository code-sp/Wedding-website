import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Move } from 'lucide-react';
import TreeNode from './TreeNode';
import PageLayout from './PageLayout';
import StandardButton from './common/StandardButton';
import { useAuth } from '../context/AuthContext';
import { useImageContext } from '../context/ImageContext';
import AdminHUD from './common/AdminHUD';

const FamilyTree = () => {
    // Layout constants
    const NODE_WIDTH = 250;
    const GAP = 100;
    const PARTNER_GAP = 20;
    const VERTICAL_SPACING = 350;

    const { isAdmin, isClient } = useAuth();
    const canEdit = isAdmin || isClient;

    useEffect(() => {
        console.log('[FAMILY_TREE] Component mounted. canEdit:', canEdit);
    }, [canEdit]);

    const {
        people: bridePeople, setPeople: setBridePeople,
        families: brideFamilies, setFamilies: setBrideFamilies,
        links: brideLinks, setLinks: setBrideLinks,
        groomPeople, setGroomPeople,
        groomFamilies, setGroomFamilies,
        groomLinks, setGroomLinks
    } = useImageContext();

    // Toggle State
    const [activeSide, setActiveSide] = useState('bride'); // 'bride' | 'groom'

    useEffect(() => {
        console.log('[FAMILY_TREE] Switching active side to:', activeSide);
    }, [activeSide]);

    // Derived State
    const people = activeSide === 'bride' ? bridePeople : groomPeople;
    const families = activeSide === 'bride' ? brideFamilies : groomFamilies;
    const links = activeSide === 'bride' ? brideLinks : groomLinks;

    const setPeople = activeSide === 'bride' ? setBridePeople : setGroomPeople;
    const setFamilies = activeSide === 'bride' ? setBrideFamilies : setGroomFamilies;
    const setLinks = activeSide === 'bride' ? setBrideLinks : setGroomLinks;

    // Layout State
    const [renderNodes, setRenderNodes] = useState([]);
    const [renderConnections, setRenderConnections] = useState([]);
    const [canvasSize, setCanvasSize] = useState({ w: 4000, h: 4000 });

    // Viewport State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);



    // --- Layout Algorithm ---
    useEffect(() => {
        const calculateLayout = () => {
            // 1. Build Graph Helpers
            const personMap = new Map(people.map(p => [p.id, p]));
            const familyMap = new Map(families.map(f => [f.id, f]));

            // Parent -> Family (Where is this person a parent?)
            const personAsParent = new Map();
            families.forEach(f => {
                if (f.partner1Id) {
                    if (!personAsParent.has(f.partner1Id)) personAsParent.set(f.partner1Id, []);
                    personAsParent.get(f.partner1Id).push(f.id);
                }
                if (f.partner2Id) {
                    if (!personAsParent.has(f.partner2Id)) personAsParent.set(f.partner2Id, []);
                    personAsParent.get(f.partner2Id).push(f.id);
                }
            });

            // Child -> Family (Who are my parents?)
            const parentOfChild = new Map();
            const familyChildren = new Map(); // FamilyID -> [ChildIDs]

            links.forEach(l => {
                parentOfChild.set(l.childId, l.familyId);

                if (!familyChildren.has(l.familyId)) familyChildren.set(l.familyId, []);
                familyChildren.get(l.familyId).push(l.childId);
            });

            // 2. Identify Roots (People with no recorded parents)
            const processedPeople = new Set();
            const rootFamilies = [];
            const rootSingles = [];

            // Find all families where NEITHER partner has a parent
            families.forEach(f => {
                const p1HasParent = f.partner1Id && parentOfChild.has(f.partner1Id);
                const p2HasParent = f.partner2Id && parentOfChild.has(f.partner2Id);

                if (!p1HasParent && !p2HasParent) {
                    rootFamilies.push(f.id);
                    if (f.partner1Id) processedPeople.add(f.partner1Id);
                    if (f.partner2Id) processedPeople.add(f.partner2Id);
                }
            });

            // Find singles who are not in any root family and have no parents (or orphaned links)
            people.forEach(p => {
                const parentFamId = parentOfChild.get(p.id);
                const parentFamExists = parentFamId && familyMap.has(parentFamId);

                if (!parentFamExists && !processedPeople.has(p.id)) {
                    const myFamilies = personAsParent.get(p.id) || [];
                    const iMarriedIn = myFamilies.some(fid => {
                        const fam = familyMap.get(fid);
                        if (!fam) return false;
                        const spouseId = fam.partner1Id === p.id ? fam.partner2Id : fam.partner1Id;
                        const spouseParentFamId = spouseId ? parentOfChild.get(spouseId) : null;
                        return spouseId && spouseParentFamId && familyMap.has(spouseParentFamId);
                    });

                    if (!iMarriedIn) {
                        rootSingles.push(p.id);
                    }
                }
            });

            // 3. Recursive Layout
            const layoutNodes = new Map(); // PersonID -> { x, y }

            const getFamilyWidth = (familyId) => {
                const fam = familyMap.get(familyId);
                if (!fam) return 0;

                let parentsWidth = NODE_WIDTH;
                if (fam.partner1Id && fam.partner2Id) parentsWidth = NODE_WIDTH * 2 + PARTNER_GAP;

                const childrenIds = familyChildren.get(familyId) || [];
                if (childrenIds.length === 0) return parentsWidth;

                const childrenTotalWidth = childrenIds.reduce((sum, childId) => {
                    const childFamilies = personAsParent.get(childId) || [];
                    const primaryChildFamId = childFamilies[0];

                    if (primaryChildFamId) {
                        return sum + getFamilyWidth(primaryChildFamId);
                    } else {
                        return sum + NODE_WIDTH;
                    }
                }, 0) + (childrenIds.length - 1) * GAP;

                return Math.max(parentsWidth, childrenTotalWidth);
            };

            const assignFamilyPosition = (familyId, x, y) => {
                const fam = familyMap.get(familyId);
                if (!fam) return;

                if (fam.partner1Id && fam.partner2Id) {
                    const p1 = personMap.get(fam.partner1Id);
                    const p2 = personMap.get(fam.partner2Id);
                    const offset = (NODE_WIDTH + PARTNER_GAP) / 2;

                    if (p1) layoutNodes.set(p1.id, { x: x - offset, y });
                    if (p2) layoutNodes.set(p2.id, { x: x + offset, y });

                } else if (fam.partner1Id) {
                    layoutNodes.set(fam.partner1Id, { x, y });
                } else if (fam.partner2Id) {
                    layoutNodes.set(fam.partner2Id, { x, y });
                }

                const childrenIds = familyChildren.get(familyId) || [];
                if (childrenIds.length > 0) {
                    let totalChildrenWidth = 0;
                    const childWidths = childrenIds.map(childId => {
                        const childFamilies = personAsParent.get(childId) || [];
                        const primaryChildFamId = childFamilies[0];
                        const w = primaryChildFamId ? getFamilyWidth(primaryChildFamId) : NODE_WIDTH;
                        totalChildrenWidth += w;
                        return { id: childId, width: w, famId: primaryChildFamId };
                    });
                    totalChildrenWidth += (childrenIds.length - 1) * GAP;

                    let currentX = x - totalChildrenWidth / 2;

                    childWidths.forEach(item => {
                        const childCenter = currentX + item.width / 2;

                        if (item.famId) {
                            assignFamilyPosition(item.famId, childCenter, y + VERTICAL_SPACING);
                        } else {
                            layoutNodes.set(item.id, { x: childCenter, y: y + VERTICAL_SPACING });
                        }

                        currentX += item.width + GAP;
                    });
                }
            };

            let currentRootX = 0;
            rootFamilies.forEach(famId => {
                const w = getFamilyWidth(famId);
                assignFamilyPosition(famId, currentRootX + w / 2, 50);
                currentRootX += w + GAP * 2;
            });

            rootSingles.forEach(pid => {
                layoutNodes.set(pid, { x: currentRootX + NODE_WIDTH / 2, y: 50 });
                currentRootX += NODE_WIDTH + GAP;
            });

            // Consolidate Render Nodes
            const newRenderNodes = [];
            layoutNodes.forEach((pos, id) => {
                const person = personMap.get(id);
                if (person) {
                    const myFamilies = personAsParent.get(id) || [];
                    const hasPartner = myFamilies.some(fid => {
                        const f = familyMap.get(fid);
                        return f.partner1Id && f.partner2Id;
                    });

                    newRenderNodes.push({
                        ...person,
                        x: pos.x,
                        y: pos.y,
                        partnerId: hasPartner ? 'exists' : null
                    });
                }
            });

            // Generate Connections
            const newConnections = [];
            families.forEach(f => {
                const children = familyChildren.get(f.id) || [];
                if (children.length === 0) return;

                let startX, startY;
                if (f.partner1Id && f.partner2Id) {
                    const p1 = layoutNodes.get(f.partner1Id);
                    const p2 = layoutNodes.get(f.partner2Id);
                    if (p1 && p2) {
                        startX = (p1.x + p2.x) / 2 + 125;
                        startY = p1.y + 220;
                    }
                } else if (f.partner1Id || f.partner2Id) {
                    const p = layoutNodes.get(f.partner1Id || f.partner2Id);
                    if (p) {
                        startX = p.x + 125;
                        startY = p.y + 220;
                    }
                }

                if (startX !== undefined) {
                    children.forEach(childId => {
                        const childPos = layoutNodes.get(childId);
                        if (childPos) {
                            newConnections.push({
                                id: `${f.id}-${childId}`,
                                startX,
                                startY,
                                endX: childPos.x + 125,
                                endY: childPos.y
                            });
                        }
                    });
                }
            });

            setRenderNodes(newRenderNodes);
            setRenderConnections(newConnections);

            const maxX = Math.max(...newRenderNodes.map(n => n.x), 0);
            const maxY = Math.max(...newRenderNodes.map(n => n.y), 0);
            setCanvasSize({
                w: Math.max(4000, maxX + 2000),
                h: Math.max(4000, maxY + 2000)
            });
        };

        calculateLayout();
    }, [people, families, links]);

    // --- Auto-Fit Logic ---
    const runFitToView = () => {
        if (renderNodes.length === 0 || !containerRef.current) return;
        
        const container = containerRef.current;
        const { clientWidth, clientHeight } = container;

        const xs = renderNodes.map(n => n.x);
        const ys = renderNodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs) + NODE_WIDTH;
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys) + 300;

        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;

        const scaleX = (clientWidth - 100) / treeWidth;
        const scaleY = (clientHeight - 100) / treeHeight;
        const fitScale = Math.min(Math.min(scaleX, scaleY), 1);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const newX = clientWidth / 2 - centerX * fitScale;
        const topAlignY = 50;

        setScale(fitScale);
        setPosition({ x: newX, y: topAlignY });
    };

    useEffect(() => {
        if (renderNodes.length > 0) {
            // Wait slightly for DOM layout to complete before fitting
            const timer = setTimeout(() => {
                runFitToView();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [renderNodes.length, activeSide]);

    // Re-fit on window resize
    useEffect(() => {
        window.addEventListener('resize', runFitToView);
        return () => window.removeEventListener('resize', runFitToView);
    }, [renderNodes]);


    // --- Actions ---

    const handleUpdateNode = (id, updatedData) => {
        setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
    };

    const handleAddMember = (sourceId, relationshipType, formData) => {
        const newPersonId = `p_${Date.now()}`;
        const newPerson = {
            id: newPersonId,
            name: formData?.name || 'New Member',
            gender: formData?.gender || 'male',
            image: null,
            relation: 'Relative'
        };

        if (!sourceId) {
            setPeople(prev => [...prev, newPerson]);
            return;
        }

        if (relationshipType === 'partner') {
            newPerson.relation = 'Partner';
            const existingFamily = families.find(f =>
                (f.partner1Id === sourceId && !f.partner2Id) ||
                (f.partner2Id === sourceId && !f.partner1Id)
            );

            if (existingFamily) {
                setFamilies(prev => prev.map(f => f.id === existingFamily.id ? {
                    ...f,
                    partner1Id: f.partner1Id || newPersonId,
                    partner2Id: f.partner2Id || newPersonId
                } : f));
                setPeople(prev => [...prev, newPerson]);
            } else {
                const newFamily = {
                    id: `f_${Date.now()}`,
                    partner1Id: sourceId,
                    partner2Id: newPersonId,
                    type: 'marriage'
                };
                setPeople(prev => [...prev, newPerson]);
                setFamilies(prev => [...prev, newFamily]);
            }

        } else if (relationshipType === 'child') {
            newPerson.relation = 'Child';
            let familyId = families.find(f => f.partner1Id === sourceId || f.partner2Id === sourceId)?.id;
            let newFamilies = [...families];
            if (!familyId) {
                familyId = `f_${Date.now()}`;
                newFamilies.push({
                    id: familyId,
                    partner1Id: sourceId,
                    partner2Id: null,
                    type: 'marriage'
                });
            }
            const newLink = { childId: newPersonId, familyId: familyId, type: 'biological' };
            setPeople(prev => [...prev, newPerson]);
            setFamilies(newFamilies);
            setLinks(prev => [...prev, newLink]);

        } else if (relationshipType === 'parent') {
            newPerson.relation = 'Parent';
            const newFamilyId = `f_${Date.now()}`;
            const newFamily = {
                id: newFamilyId,
                partner1Id: newPersonId,
                partner2Id: null,
                type: 'marriage'
            };
            const newLink = { childId: sourceId, familyId: newFamilyId, type: 'biological' };
            setPeople(prev => [...prev, newPerson]);
            setFamilies(prev => [...prev, newFamily]);
            setLinks(prev => [...prev, newLink]);

        } else if (relationshipType === 'sibling') {
            newPerson.relation = 'Sibling';
            const parentFamilyId = links.find(l => l.childId === sourceId)?.familyId;

            if (parentFamilyId) {
                const newLink = { childId: newPersonId, familyId: parentFamilyId, type: 'biological' };
                setPeople(prev => [...prev, newPerson]);
                setLinks(prev => [...prev, newLink]);
            } else {
                const newFamilyId = `f_${Date.now()}`;
                const newFamily = { id: newFamilyId, partner1Id: null, partner2Id: null, type: 'marriage' };
                const link1 = { childId: sourceId, familyId: newFamilyId, type: 'biological' };
                const link2 = { childId: newPersonId, familyId: newFamilyId, type: 'biological' };
                setPeople(prev => [...prev, newPerson]);
                setFamilies(prev => [...prev, newFamily]);
                setLinks(prev => [...prev, link1, link2]);
            }
        }
    };

    const handleDeleteNode = (id) => {
        const toDelete = new Set([id]);
        const findDescendants = (pid) => {
            const myFamilies = families.filter(f => f.partner1Id === pid || f.partner2Id === pid);
            myFamilies.forEach(f => {
                const children = links.filter(l => l.familyId === f.id);
                children.forEach(c => {
                    if (!toDelete.has(c.childId)) {
                        toDelete.add(c.childId);
                        findDescendants(c.childId);
                    }
                });
            });
        };

        const isChild = links.some(l => l.childId === id);
        if (isChild || id.startsWith('p_root')) {
            const myFamilies = families.filter(f => f.partner1Id === id || f.partner2Id === id);
            myFamilies.forEach(f => {
                if (f.partner1Id && f.partner1Id !== id) toDelete.add(f.partner1Id);
                if (f.partner2Id && f.partner2Id !== id) toDelete.add(f.partner2Id);
            });
            findDescendants(id);
        }

        setPeople(prev => prev.filter(p => !toDelete.has(p.id)));
        setLinks(prev => prev.filter(l => !toDelete.has(l.childId)));
        setFamilies(prev => prev.map(f => ({
            ...f,
            partner1Id: toDelete.has(f.partner1Id) ? null : f.partner1Id,
            partner2Id: toDelete.has(f.partner2Id) ? null : f.partner2Id
        })).filter(f => f.partner1Id || f.partner2Id));
    };


    // --- Viewport Logic (Zoom/Pan) ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            if (e.ctrlKey) {
                const zoomSensitivity = 0.01;
                const delta = -e.deltaY * zoomSensitivity;
                const newScale = Math.min(Math.max(scale + delta, 0.1), 10);
                if (newScale === scale) return;

                const rect = container.getBoundingClientRect();
                const cursorX = e.clientX - rect.left;
                const cursorY = e.clientY - rect.top;
                const contentX = (cursorX - position.x) / scale;
                const contentY = (cursorY - position.y) / scale;
                const newX = cursorX - contentX * newScale;
                const newY = cursorY - contentY * newScale;

                setScale(newScale);
                setPosition({ x: newX, y: newY });
            } else {
                setPosition(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [scale, position]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e) => {
        if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };
    const handleTouchMove = (e) => {
        if (isDragging && e.touches.length === 1) {
            setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
        }
    };
    const handleTouchEnd = () => setIsDragging(false);


    return (
        <PageLayout backgroundText="legacy">
            <div className="absolute inset-0 z-10 flex flex-col overflow-hidden">
                
                {/* HEADER SECTION */}
                <div className="w-full pt-8 md:pt-10 pb-2 flex flex-col items-center text-center relative z-30 shrink-0 pointer-events-none">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 shadow-sm backdrop-blur-md">
                        Family
                    </span>
                    <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter mb-4">
                        Our <span className="text-white/50 italic font-light">Legacy</span>
                    </h2>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto font-serif italic px-4 mb-4">
                        The roots and branches of our family heritage.
                    </p>

                    {/* Side Toggle */}
                    <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1.5 w-fit relative border border-white/15 shadow-inner pointer-events-auto">
                        <motion.div
                            className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-lg z-0 border border-brand-black/5"
                            initial={false}
                            animate={{
                                left: activeSide === 'bride' ? '6px' : '50%',
                                width: 'calc(50% - 6px)',
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                        <button 
                            onClick={() => setActiveSide('bride')} 
                            className={`relative z-10 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors duration-500 truncate min-w-[100px] md:min-w-[120px] ${activeSide === 'bride' ? 'text-zinc-950' : 'text-white/40 hover:text-white'}`}
                        >
                            Bride's Side
                        </button>
                        <button 
                            onClick={() => setActiveSide('groom')} 
                            className={`relative z-10 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors duration-500 truncate min-w-[100px] md:min-w-[120px] ${activeSide === 'groom' ? 'text-zinc-950' : 'text-white/40 hover:text-white'}`}
                        >
                            Groom's Side
                        </button>
                    </div>
                </div>

                {/* CANVAS SECTION */}
                <div className="w-full flex-1 relative px-2 pb-2 md:px-4 md:pb-4 min-h-0">
                    <div
                        className="w-full h-full rounded-[2rem] overflow-hidden bg-white/20 backdrop-blur-xl cursor-move relative border border-white/40 shadow-2xl touch-none group/canvas"
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                             <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/80 text-[9px] font-bold uppercase tracking-widest text-brand-black/60 shadow-sm flex items-center gap-1.5">
                                <Move size={10} /> Drag to explore
                             </div>
                        </div>

                        <motion.div
                            className="absolute origin-top-left"
                            animate={{ x: position.x, y: position.y, scale: scale }}
                            transition={{ 
                                type: isDragging ? 'tween' : 'spring',
                                duration: isDragging ? 0 : undefined,
                                stiffness: 300,
                                damping: 30
                            }}
                        >
                            <svg className="absolute top-0 left-0 pointer-events-none z-0" style={{ width: canvasSize.w, height: canvasSize.h }}>
                                {renderConnections.map(conn => {
                                    const midY = (conn.startY + conn.endY) / 2;
                                    return (
                                        <path
                                            key={conn.id}
                                            d={`M${conn.startX},${conn.startY} C${conn.startX},${midY} ${conn.endX},${midY} ${conn.endX},${conn.endY}`}
                                            fill="none" 
                                            stroke="rgba(0, 0, 0, 0.08)" 
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}
                            </svg>
                            <div className="relative z-10" style={{ width: canvasSize.w, height: canvasSize.h }}>
                                {renderNodes.map(node => (
                                    <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
                                        <TreeNode
                                            node={node}
                                            canEdit={canEdit}
                                            onUpdate={handleUpdateNode}
                                            onDelete={handleDeleteNode}
                                            onAddChild={(data) => handleAddMember(node.id, 'child', data)}
                                            onAddPartner={(data) => handleAddMember(node.id, 'partner', data)}
                                            onAddParent={(data) => handleAddMember(node.id, 'parent', data)}
                                            onAddSibling={(data) => handleAddMember(node.id, 'sibling', data)}
                                            isRoot={!links.some(l => l.childId === node.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Empty State / Initial Add Button */}
                        {canEdit && renderNodes.length === 0 && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                                <div className="flex flex-col items-center text-center max-w-sm mx-4 pointer-events-auto">
                                    <p className="text-brand-black/60 font-medium text-sm md:text-base mb-6">Every legacy begins with a single name</p>
                                    <StandardButton
                                        onClick={() => handleAddMember(null, null, { name: 'New Member', gender: 'male' })}
                                        variant="primary"
                                        icon={Plus}
                                        expandable={false}
                                        size="lg"
                                        className="shadow-xl"
                                    >
                                        Add First Member
                                    </StandardButton>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default FamilyTree;
