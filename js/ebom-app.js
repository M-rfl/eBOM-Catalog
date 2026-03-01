/*!
 * eBOM Catalog - Application Logic  v2.0
 * (c) 2025 eBOM Catalog. All rights reserved.
 *
 * Dependencies (loaded before this file via head CDN tags):
 *   - SheetJS / xlsx.js  v0.18.5
 *   - @google/model-viewer  (type="module")
 */

/* ── DOMContentLoaded helper -- works whether DOM is already ready or not ── */
function runWhenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/* ── Global State Variables ── */
let currentSelectedNode = null;
var isEditMode = false;
var isFullEditMode = false;

/* ── Global helper: find a node by name in hierarchy data ── */
function findItemByName(data, name) {
    if (!Array.isArray(data)) return null;
    for (const it of data) {
        if (it && (it.originalname === name || it.name === name)) return it;
        if (it && Array.isArray(it.children)) {
            const f = findItemByName(it.children, name);
            if (f) return f;
        }
    }
    return null;
}



/* --- <script> (body outside template) --- */
const imageMap = {
    	    "2105195": "1pYKOzXkT8cip_vxGeXCgTD9-h1U2mQPY",  // example: material ID → file ID on Drive
	};
	function generateChildTable(selectedItem) {
	    let tableContainer = document.getElementById("tableContainer"); // Ensure it is not declared twice

    	    if (!selectedItem) {
                tableContainer.innerHTML = "<p>Nenhum item selecionado.</p>";
                return;
    	    }

    	    const rows = [];

	
	    // Add the selected item as the first row
	    rows.push({
		Nome: selectedItem.originalname || "N/A",
		//Descrição: selectedItem.description || "N/A",
		"Id": (selectedItem.idFigura ?? selectedItem.id ?? (Array.isArray(selectedItem.cadastro) ? selectedItem.cadastro?.[0]?.id : selectedItem.cadastro?.id) ?? "").toString() || "N/A",
		"Fornecedor": selectedItem.fabricanteFornecedor || "N/A",
		"Ref. Comercial": selectedItem.referenciaComercial || "N/A",
		"Qtd": selectedItem.qtd || "N/A",
		"Código SAP": selectedItem.codigoSap || "N/A",
	    });

	    // Add the child items after the selected item
    	    if (selectedItem.children && selectedItem.children.length > 0) {
		selectedItem.children.forEach(child => {
        	    rows.push({
            	        Nome: child.originalname || "N/A",
			//Descrição: child.description || "N/A",
			"Id": child.idFigura || "N/A",
			"Fornecedor": child.fabricanteFornecedor || "N/A",
			"Ref. Comercial": child.referenciaComercial || "N/A",
			"Qtd": child.qtd || "N/A",
            	        "Código SAP": child.codigoSap || "N/A",
			
});
    	        });
	    }

    	    // Clear and render the table
	    tableContainer.innerHTML = ""; // Clear previous content
    	    const table = document.createElement("table");
    	    table.style.width = "100%";
    	    table.style.borderCollapse = "collapse";

    	    // Create table headers
    	    const thead = document.createElement("thead");
    	    const headerRow = document.createElement("tr");
    	    Object.keys(rows[0]).forEach(key => {
        	const th = document.createElement("th");
        	th.style.border = "1px solid #ddd";
        	th.style.padding = "8px";
        	th.style.backgroundColor = "#f4f4f4";
        	th.textContent = key;
        	headerRow.appendChild(th);
    	    });
    	    thead.appendChild(headerRow);
    	    table.appendChild(thead);

    	    // Create table rows
    	    const tbody = document.createElement("tbody");
    	    rows.forEach(row => {
        	const tr = document.createElement("tr");
        	Object.entries(row).forEach(([key, value]) => {
            	    const td = document.createElement("td");
            	    td.style.border = "1px solid #ddd";
            	    td.style.padding = "8px";
		    if (key === "Doc") {
			td.innerHTML = value; // Render as HTML for buttons
		    } else {
			td.textContent = value; // Render as plain text
		    }
            	    tr.appendChild(td);
        	});
           	tbody.appendChild(tr);
    	    });
    	    table.appendChild(tbody);

    	    tableContainer.appendChild(table);
	}

	function exportToExcel() {
            if (!hierarchyData || hierarchyData.length === 0) {
                alert("Nenhum dado disponível para exportação.");
            	return;
            }

            // Get the selected tree item
            const selectedTreeItem = document.querySelector('.tree-item.selected');
            if (!selectedTreeItem) {
                alert("Selecione um item na árvore para exportar.");
                return;
            }

            const selectedName = selectedTreeItem.querySelector('.item-originalname').textContent;

            // Find the selected item and its children in the hierarchy data
            function findItem(data, originalname) {
                for (const item of data) {
                    if (item.originalname === originalname) return item;
                    if (item.children && item.children.length > 0) {
                        const result = findItem(item.children, originalname);
                        if (result) return result;
                    }
                }
                return null;
            }

            const selectedItem = findItem(hierarchyData, selectedName);
            if (!selectedItem) {
                alert("Erro ao localizar o item selecionado.");
                return;
            }

            // Collect parent and all descendants' data recursively
            const rows = [];
            function addRow(item, level = 1) {
		const prefix = "   ".repeat(level - 1); // Bullet-style indentation
                rows.push({
                    "Código SAP": item.codigoSap || "N/A",
                    "Texto breve de material": `${prefix}${item.originalname || "N/A"}`,
		    //"Descrição": item.description || "N/A",
		    "Fornecedor": item.fabricanteFornecedor || "N/A",
		    "Ref. Comercial": item.referenciaComercial || "N/A",
		    "Qtd": item.qtd || "N/A"
                });
	    // Recursively add all children with increased level
	    	if (item.children && item.children.length > 0) {
	            item.children.forEach(child => addRow(child, level + 1));
            	};
	    }

            // Add parent item
            addRow(selectedItem);
	    
            // Convert data to a worksheet and create a workbook
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

            // Export to XLSX
            const filename = `${selectedName.replace(/\s+/g, "_")}_BOM.xlsx`;
            XLSX.writeFile(workbook, filename);
        }

        
        function toggleTabMenu() {
            const nav = document.getElementById('tabNav');
            if (!nav) return;

            // Menu totalmente oculto ou totalmente visível
            nav.classList.toggle('hidden');

            const btn = document.getElementById('navToggleBtn');
            const isHidden = nav.classList.contains('hidden');
            if (btn) {
                btn.setAttribute('aria-label', isHidden ? 'Mostrar menu' : 'Ocultar menu');
                btn.setAttribute('title', isHidden ? 'Mostrar menu' : 'Ocultar menu');
            }
        }

function switchTab(tabId) {
            // Deactivate all tabs and contents
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tabContent').forEach(content => content.classList.remove('active'));

            // Activate the clicked tab and its content
            document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
            document.getElementById(tabId).classList.add('active');
            // Align left menu with the top of the active tab's import bar
            initTabImportToggle();
            
            try{ initChecklistDigitalTab(); }catch(e){}
requestAnimationFrame(syncTabNavTop);
        }


        // Keep the left tab menu aligned with the active tab's import bar
        function syncTabNavTop(){
            const nav = document.getElementById('tabNav');
            if(!nav) return;

            const bar = document.querySelector('.tabContent.active .tab-import-bar');
            if(!bar){
                // fallback: sit at top
                nav.style.top = '0px';
                nav.style.height = '100vh';
                return;
            }

            const rect = bar.getBoundingClientRect();
            const topPx = Math.max(0, Math.round(rect.top));
            nav.style.top = topPx + 'px';
            nav.style.height = 'calc(100vh - ' + topPx + 'px)';
        }


        // Toggle (▲/▼) for tab-import-bar (per tab)
        function initTabImportToggle(){
            document.querySelectorAll('.tabContent .tab-import-bar:not(.chat-import-spacer)').forEach(bar=>{
                // Avoid duplicate buttons/listeners
                const btn = bar.querySelector('.toggle-import-bar');
                if(!btn) return;
                if(btn.dataset.bound === '1') return;
                btn.dataset.bound = '1';

                btn.addEventListener('click', ()=>{
                    bar.classList.toggle('collapsed');
                    const collapsed = bar.classList.contains('collapsed');
                    btn.textContent = collapsed ? '▼' : '▲';
                    btn.setAttribute('aria-label', collapsed ? 'Exibir seção de importação' : 'Ocultar seção de importação');
                    btn.setAttribute('title', collapsed ? 'Exibir' : 'Ocultar');
                    requestAnimationFrame(syncTabNavTop);
                });
            });
        }

        window.addEventListener('resize', () => requestAnimationFrame(syncTabNavTop));
        runWhenReady( () => { initTabImportToggle(); requestAnimationFrame(syncTabNavTop); });

        let hierarchyData = [];
        let scale = 1;
        let isDragging = false;
        let startX, startY;
        const componentImage = document.getElementById('componentImage');

        // Load JSON file (SISTEMA/EQUIPAMENTO)
        function loadSistemaEquipamentoJSON() {
            const fileInput = document.getElementById("fileInput");
            const file = fileInput.files[0];

            if (!file) {
                alert("Por favor, selecione um arquivo JSON.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    hierarchyData = JSON.parse(event.target.result);
                    generateTree();
                    alert("Sistema/Equipamento JSON carregado com sucesso!");
                } catch (e) {
                    alert("Arquivo JSON inválido.");
                    console.error(e);
                }
            };
            reader.readAsText(file);
        }

        // Image handling functions
        function zoomImage(factor) {
            scale *= factor;
            componentImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }

        function resetZoom() {
            scale = 1;
    	    componentImage.style.left = '50%';  // Reset left position to center
     	    componentImage.style.top = '50%';   // Reset top position to center
            componentImage.style.transform = "translate(-50%, -50%) scale(1)";
        }

        // Mouse event handlers for dragging
        componentImage.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
        });

        window.addEventListener("mousemove", (e) => {
            if (isDragging) {
                const x = e.pageX - startX;
                const y = e.pageY - startY;
                componentImage.style.left = `calc(50% + ${x}px)`;
                componentImage.style.top = `calc(50% + ${y}px)`;
		componentImage.style.cursor = "grabbing"
            }
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
            componentImage.style.cursor = "grab";
        });

        // Generate tree structure
        function generateTree() {
            const treeContent = document.getElementById("treeContent");
            treeContent.innerHTML = "";
            treeContent.appendChild(createTree(hierarchyData, true));
        }

        function createTree(data, isRoot = false) {
            const ul = document.createElement("ul");

            data.forEach(item => {
                const li = document.createElement("li");
                const itemContainer = document.createElement("div");
                itemContainer.className = "tree-item";
    try {
      itemContainer.dataset.sap  = (item.codigoSap || "");
      itemContainer.dataset.ref  = (item.referenciaComercial || "");
      itemContainer.dataset.forn = (item.fabricanteFornecedor || "");
      itemContainer.dataset.desc = (item.description || "");
    } catch(e) {}
    if (item.children && item.children.length > 0) {
                    const toggleButton = document.createElement("button");
                    toggleButton.className = "toggle-btn";
                    toggleButton.textContent = "+";
                    toggleButton.onclick = () => {
                        const childrenUl = li.querySelector("ul");
                        if (childrenUl) {
                            const isHidden = childrenUl.style.display === "none";
                            childrenUl.style.display = isHidden ? "block" : "none";
                            toggleButton.textContent = isHidden ? "-" : "+";
                        }
                    };
                    itemContainer.appendChild(toggleButton);
                } else {
                    const placeholder = document.createElement("span");
                    placeholder.className = "toggle-placeholder";
                    itemContainer.appendChild(placeholder);
                }

                const nameSpan = document.createElement("span");
                nameSpan.className = "item-originalname";
                nameSpan.textContent = item.originalname;
                nameSpan.style.cursor = "pointer";
                nameSpan.onclick = function () {
    updateDocButtonColor(item);
		    highlightSelected(itemContainer); // Highlight the selected item
		    displayDetails(
                    	item.description,
                    	item.codigoSap,
			item.idFigura,
                    	item.documentation,
                    	item.imageUrl1,
                    	item.imageUrl2,
                    	item.imageUrl3,
			item.originalname,
			item.fabricanteFornecedor,
			item.referenciaComercial,
			item.qtd,
			item.cadastro
                    );
		};
                itemContainer.appendChild(nameSpan);

                li.appendChild(itemContainer);

                if (item.children && item.children.length > 0) {
                    const childrenUl = createTree(item.children, false);
                    childrenUl.style.display = "none";
                    li.appendChild(childrenUl);
                }

                ul.appendChild(li);
            });

            return ul;
        }

	function highlightSelected(item) {
    	    // Remove the 'selected' class from all items
    	    const items = document.querySelectorAll('.tree-item');
    	    items.forEach(el => el.classList.remove('selected'));

    	    // Add the 'selected' class to the clicked item
    	    item.classList.add('selected');
	}
	
	let currentImageIndex = 0;
	let imageUrls = []; // Replace this with your actual image URL array

	function updateImageInfo() {
    	    const imageInfo = document.getElementById('imageInfo');
    	    imageInfo.textContent = `${currentImageIndex + 1} / ${imageUrls.length}`;
	}

        function displayDetails(description, codigoSap, idFigura, documentation, imageUrl1, imageUrl2, imageUrl3, originalname, fabricanteFornecedor, referenciaComercial, qtd, cadastro) {

	    const selectedTreeItem = document.querySelector('.tree-item.selected');
	    if (!selectedTreeItem) {
        	console.error("No tree item selected.");
        	return;
    	    }
	
	    const selectedName = selectedTreeItem.querySelector('.item-originalname').textContent;

    	    function findItem(data, originalname) {
        	for (const item of data) {
            	    if (item.originalname === originalname) return item;
            	    if (item.children && item.children.length > 0) {
                	const result = findItem(item.children, originalname);
                	if (result) return result;
            	    }
        	}
        	return null;
    	    }

    	    const selectedItem = findItem(hierarchyData, selectedName);
    	    if (!selectedItem) {
        	console.error("Selected item not found in hierarchy.");
        	return;
    	    }

    	    // Generate and display the table for child data
    	    generateChildTable(selectedItem);

	    imageUrls = [imageUrl1, imageUrl2, imageUrl3].filter(url => url); // Keep only valid URLs
	    currentImageIndex = 0;
	    updateImage();
	}
	

	function showDocumentation(description, codigoSap, documentation, originalname, fabricanteFornecedor, referenciaComercial, qtd) {
	    
	    // Function to convert documentation into clickable links with line breaks
    	    function makeLinksClickable(doc) {
                if (!doc) return "Nenhuma documentação disponível"

    		// Normalize text (handle escaped characters)
    		const decodedDoc = decodeURIComponent(doc);
		
		// Split documentation by semicolon and process each entry
                const entries = doc.split(";").map(entry => entry.trim());

                return entries

		    .map(entry => {
			// Match a description followed by a URL using regex
			const match = entry.match(/^(.+?):\s*(https?:\/\/[^\s]+.*)$/);
			if (match) {
			    const text = match[1].trim(); // Capture the description
			    const url = match[2].trim();  // Capture the URL
			    return `<a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${text}</a>`;
			}
			return entry; // If no URL, return the entry as is			
		    })
		    .join("<br>"); // Join entries with line breaks
	    }
	   
	    // Create the dark overlay
	    const overlay = document.createElement("div");
    	    overlay.style.position = "fixed";
    	    overlay.style.top = "0";
    	    overlay.style.left = "0";
    	    overlay.style.width = "100%";
    	    overlay.style.height = "100%";
    	    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black
    	    overlay.style.zIndex = "999";
    	    overlay.onclick = () => document.body.removeChild(overlay); // Close on clicking the overlay

	    // Create table layout for additional details
    	    const tableHtml = `
        	<div>
                    <p><strong>Documentação:</strong><br>${makeLinksClickable(documentation)}</p>
		</div>
    	    `;

	    // Create and display the pop-up
    	    const popUp = document.createElement("div");
    	    popUp.style.position = "fixed";
    	    popUp.style.top = "50%";
    	    popUp.style.left = "50%";
    	    popUp.style.transform = "translate(-50%, -50%)";
    	    popUp.style.zIndex = "1000";
    	    popUp.style.backgroundColor = "white";
    	    popUp.style.padding = "20px";
    	    popUp.style.border = "1px solid #ccc";
    	    popUp.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
    	    popUp.innerHTML = tableHtml;

    	    // Add a close button
    	    const closeButton = document.createElement("button");
    	    closeButton.textContent = "Fechar";
    	    closeButton.style.marginTop = "10px";
    	    closeButton.style.backgroundColor = "#FF7C3C";
    	    closeButton.style.color = "white";
    	    closeButton.style.border = "none";
    	    closeButton.style.padding = "10px";
    	    closeButton.style.cursor = "pointer";
    	    closeButton.onclick = () => {
		document.body.removeChild(popUp);
		document.body.removeChild(overlay); // Remove the overlay when closing the pop-up
	    };
    	    popUp.appendChild(closeButton);

    	    // Append the overlay and pop-up to the body
	    document.body.appendChild(overlay);
	    document.body.appendChild(popUp);
	}

	
// --- GLB helper: rebuild model-viewer to restore interactivity after hide/show ---
function rebuildComponentModelViewer() {
    const old = document.getElementById("componentModel");
    if (!old || !old.parentNode) return null;

    const parent = old.parentNode;
    const mv = old.cloneNode(true); // resets internal state (fixes "static" after switching back)
    // keep same id (clone already keeps it) and reset runtime state
    mv.src = "";
    mv.style.display = "none";
    mv.style.pointerEvents = "auto";
    mv.setAttribute("camera-controls", "");
    mv.setAttribute("touch-action", "pan-y");

    parent.replaceChild(mv, old);
    return mv;
}

function updateImage() {
    const componentImage = document.getElementById("componentImage");
    let componentModel = document.getElementById("componentModel");
    const prevButton = document.getElementById("prevImage");
    const nextButton = document.getElementById("nextImage");
    const zoomControls = document.getElementById("zoomControls");

    let noImageText = document.getElementById("noImageText");
    if (!noImageText) {
        noImageText = document.createElement("div");
        noImageText.id = "noImageText";
        noImageText.textContent = "SEM FIGURA";
        noImageText.style.position = "absolute";
        noImageText.style.top = "50%";
        noImageText.style.left = "50%";
        noImageText.style.transform = "translate(-50%, -50%)";
        noImageText.style.fontSize = "2em";
        noImageText.style.color = "#999";
        noImageText.style.fontWeight = "bold";
        noImageText.style.zIndex = "5";
        noImageText.style.pointerEvents = "none";
        noImageText.style.display = "none";
        document.getElementById("imageContainer").appendChild(noImageText);
    }

    const hasAny = Array.isArray(imageUrls) && imageUrls.length > 0;
    if (!hasAny) {
        // Nothing to show
        if (componentImage) { componentImage.onerror = null; componentImage.src = ""; componentImage.style.display = "none"; }
        if (componentModel) { componentModel.src = ""; componentModel.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "none";
        noImageText.style.display = "block";
        const info = document.getElementById("imageInfo");
        if (info) info.textContent = "0 / 0";
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        return;
    }

    const url = (imageUrls[currentImageIndex] || "").toString().trim();

    // 3D model (.glb/.gltf)
    if (isGlbUrl(url)) {
        if (componentImage) { componentImage.onerror = null; componentImage.src = ""; componentImage.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "none";
        noImageText.style.display = "none";

        componentModel = rebuildComponentModelViewer() || componentModel;

        if (componentModel) {
            componentModel.style.display = "block";
            componentModel.style.pointerEvents = "auto";
            componentModel.setAttribute("camera-controls", "");
            // Force reload even if same URL
            componentModel.src = "";
            setTimeout(() => { componentModel.src = url; }, 30);

            // In case of load error, fall back to "SEM FIGURA"
            const onError = () => {
                console.error("GLB load failed:", url);
                componentModel.style.display = "none";
                noImageText.style.display = "block";
            };
            componentModel.removeEventListener("error", onError);
            componentModel.addEventListener("error", onError, { once: true });
            const onLoad = () => {
                // Hide "SEM FIGURA" if the model loads successfully
                noImageText.style.display = "none";
            };
            componentModel.removeEventListener("load", onLoad);
            componentModel.addEventListener("load", onLoad, { once: true });

        } else {
            // model-viewer not available
            noImageText.style.display = "block";
        }

        updateImageInfo();
    } else {
        // Regular image
        if (componentModel) { componentModel.src = ""; componentModel.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "block";
        noImageText.style.display = "none";

        if (componentImage) {
            componentImage.style.display = "block";
            componentImage.src = url;
            componentImage.onerror = () => {
                console.error("Image load failed:", url);
                componentImage.style.display = "none";
                noImageText.style.display = "block";
            };
        }
        resetZoom();
        updateImageInfo();
    }

    if (prevButton) prevButton.disabled = currentImageIndex <= 0;
    if (nextButton) nextButton.disabled = currentImageIndex >= imageUrls.length - 1;
}

	
	function navigateImage(direction) {
	    currentImageIndex += direction;
	    updateImage();
	}
        
	// Function to load JSON file (Base Cadastro)
    	function loadBaseCadastroJSON() {
            const fileInputCadastro = document.getElementById('fileInputCadastro');
            const file = fileInputCadastro.files[0];
        
            if (!file) {
            alert('Por favor, selecione um arquivo JSON.');
            return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
            try {
               	// Parse the loaded JSON
               	const rawData = JSON.parse(event.target.result);
                   
			// Verify the structure matches the expected fields
                	if (Array.isArray(rawData) && rawData.length > 0 && 'Centro' in rawData[0]) {
                    	jsonData = rawData;
                    	document.getElementById('searchInput').disabled = false; // Enable the search input
                    	populateDepósitoFilter(); // Populate the Depósito filter dropdown
                    	alert("Material search JSON succesfully loaded!");
                	} else {
                    	throw new Error('Estrutura de JSON inválida.');
                	}
            	} catch (error) {
                	alert('Erro ao carregar JSON. Verifique o arquivo e sua estrutura.');
                	console.error('Error:', error);
            	}
        	};
        	reader.onerror = function() {
            	alert('Erro ao ler o arquivo. Por favor, tente novamente.');
        	};
        	reader.readAsText(file, 'UTF-8'); // Ensure UTF-8 encoding
    	}

    	// Function to populate the Depósito dropdown with unique values sorted from smallest to largest
    	function populateDepósitoFilter() {
        	const depositoSelect = document.getElementById('depositoFilter');
        	const depositoValues = [...new Set(jsonData.map(item => item["Depósito"]))]; // Get unique values from "Depósito"
            
        	// Sort the values numerically (ascending order)
        	depositoValues.sort((a, b) => a - b);

        	// Add options to the dropdown
        	depositoValues.forEach(value => {
            	const option = document.createElement('option');
            	option.value = value;
            	option.textContent = value;
            	depositoSelect.appendChild(option);
                
        	});
        	depositoSelect.disabled = false; // Enable the dropdown
		searchCondition.disabled = false;
            
    	}
        
    	// Function to filter and display the data
    	function filterData() {
    		const input = document.getElementById('searchInput').value.toLowerCase(); // Get input and convert to lowercase
		const searchCondition = document.getElementById('searchCondition').value;
    		const depositoFilter = document.getElementById('depositoFilter').value;
    		const utilizacaoLivreCheckbox = document.getElementById('utilizacaoLivreCheckbox').checked;
    		const tableBody = document.getElementById('resultTable').querySelector('tbody');
		const resultCount = document.getElementById('resultCount');
    		tableBody.innerHTML = ''; // Clear previous results

		if (typeof jsonData === 'undefined' || !jsonData) {
		    alert('Por favor, carregue o JSON primeiro.');
		    return;
		}

 		// Split the input into multiple keywords
    		const keywords = input.split(' ').filter(keyword => keyword.trim() !== ''); // Remove empty spaces
         
        	// Filter JSON data based on all conditions
        	const filteredData = jsonData.filter(item => {
            	    const matchesSearchInput = (searchCondition === 'E')
            		? keywords.every(keyword =>
                	    (item["Texto breve de material"] && item["Texto breve de material"].toLowerCase().includes(keyword)) ||
                	    (item["Texto Longo"] && item["Texto Longo"].toLowerCase().includes(keyword)) ||
                	    (item["Material"] && item["Material"].toString().toLowerCase().includes(keyword)))
            		: keywords.some(keyword =>
                	    (item["Texto breve de material"] && item["Texto breve de material"].toLowerCase().includes(keyword)) ||
                	    (item["Texto Longo"] && item["Texto Longo"].toLowerCase().includes(keyword)) ||
                	    (item["Material"] && item["Material"].toString().toLowerCase().includes(keyword)));

        	    const matchesDepósito = depositoFilter ? item["Depósito"] === depositoFilter : true;
        	    const matchesUtilizacaoLivre = utilizacaoLivreCheckbox ? item["Utilização livre"] > 0 : true;
        	    return matchesSearchInput && matchesDepósito && matchesUtilizacaoLivre;
                
        	});
            
		// Function to highlight matching keywords in text
		const highlightMatch = (text, keywords) => {
    		    if (!text) return ''; // Handle cases where text is null or undefined
    		    let regex = new RegExp(`(${keywords.join('|')})`, 'gi'); // Create a regex for all keywords
    		    return text.replace(regex, '<span class="highlight">$1</span>'); // Wrap matches in a span
		};


		// Display filtered results
		filteredData.forEach(item => {
		    const materialId = item["Material"];
		    const imageUrl = item["Image URL"];
            const imageLink = imageUrl && imageUrl.toLowerCase() !== "none"
            ? `<span onclick="showImageModal('${imageUrl}', '${materialId}')" title="Visualizar imagem" style="color: blue; text-decoration: underline; cursor: pointer;">${materialId}</span>`
            : materialId;
		
		    const highlightedMaterial = highlightMatch(item["Texto breve de material"], keywords);
		    const highlightedLongText = highlightMatch(item["Texto Longo"], keywords);

            	    const row = `
                	<tr>
                    	    <td>${item["Centro"]}</td>
                    	    <td>${imageLink}</td>
                    	    <td>${highlightedMaterial}</td> <!-- Use the highlighted text here -->
                    	    <td>${highlightedLongText}</td> <!-- Use the highlighted text here -->
                    	    <td>${item["Depósito"] !== null ? item["Depósito"] : 'N/A'}</td>
                    	    <td>${item["Utilização livre"] !== null ? item["Utilização livre"] : 'N/A'}</td>
                	</tr>`;    
		    tableBody.insertAdjacentHTML('beforeend', row);
        	});

		// Update result count
    		resultCount.textContent = `Total: ${filteredData.length}`;
    	}

	function showMaterialImage(materialId) {
	    const fileId = imageMap[materialId];
    	    if (!fileId) {
        	alert("Imagem não encontrada para este material.");
            	return;
    	    }

	    const imageUrl = `https://drive.google.com/thumbnail?id=${fileId}`;

	    const overlay = document.createElement("div");
    	    overlay.style.position = "fixed";
    	    overlay.style.top = "0";
    	    overlay.style.left = "0";
    	    overlay.style.width = "100%";
    	    overlay.style.height = "100%";
    	    overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
    	    overlay.style.zIndex = 1000;
    	    overlay.onclick = () => document.body.removeChild(overlay);

    	    const img = document.createElement("img");
    	    img.src = imageUrl;
    	    img.style.maxWidth = "90%";
    	    img.style.maxHeight = "90%";
    	    img.style.position = "absolute";
    	    img.style.top = "50%";
    	    img.style.left = "50%";
    	    img.style.transform = "translate(-50%, -50%)";
    	    img.style.border = "5px solid white";
    	    img.style.boxShadow = "0 0 20px black";

    	    overlay.appendChild(img);
    	    document.body.appendChild(overlay); 
	
    	}

	function exportSearchResultsToExcel() {
    	    const tableBody = document.getElementById('resultTable').querySelector('tbody');
    	    const rows = Array.from(tableBody.querySelectorAll('tr'));

    	    if (rows.length === 0) {
        	alert("Nenhum resultado disponível para exportação.");
        	return;
    	    }

    	    const data = [];
    	    rows.forEach(row => {
        	const cells = row.querySelectorAll('td');
        	const rowData = {
            	    Centro: cells[0].textContent,
            	    Material: cells[1].textContent,
            	    'Texto breve de material': cells[2].textContent,
            	    'Texto Longo': cells[3].textContent,
            	    Depósito: cells[4].textContent,
            	    'Utilização livre': cells[5].textContent,
        	};
        	data.push(rowData);
    	    });

    	    const worksheet = XLSX.utils.json_to_sheet(data);
    	    const workbook = XLSX.utils.book_new();
    	    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados de Pesquisa');

    	    const filename = `Resultados_Pesquisa_${new Date().toISOString().slice(0, 10)}.xlsx`;
    	    XLSX.writeFile(workbook, filename);

	    const imageMap = {
    		"2105195": "1pYKOzXkT8cip_vxGeXCgTD9-h1U2mQPY",
	    };
	}
  
/* --- <script> (body outside template) --- */
document.querySelector('.info-button').addEventListener('click', function() {
        document.querySelector('.info-popup').style.display = 'block';
        document.querySelector('.info-popup-overlay').style.display = 'block';
    });
    document.querySelector('.info-popup .close-button').addEventListener('click', function() {
        document.querySelector('.info-popup').style.display = 'none';
        document.querySelector('.info-popup-overlay').style.display = 'none';
    });
    document.querySelector('.info-popup-overlay').addEventListener('click', function() {
        document.querySelector('.info-popup').style.display = 'none';
        document.querySelector('.info-popup-overlay').style.display = 'none';
    });
  
/* --- <script> (body outside template) --- */
function handleEditDocClick() {
    const selectedTreeItem = document.querySelector('.tree-item.selected');
    if (!selectedTreeItem) {
        alert("Por favor, selecione um item da árvore para editar a documentação.");
        return;
    }

    const selectedName = selectedTreeItem.querySelector('.item-originalname').textContent;
    const node = findItemByName(hierarchyData, selectedName);
    if (!node) return;

    window.__currentNodeName = selectedName;

    const entries = (node.documentation || "").split(";").map(e => e.trim());
    document.getElementById("docLink1").value = entries[0] || "";
    document.getElementById("docLink2").value = entries[1] || "";
    document.getElementById("docLink3").value = entries[2] || "";

    document.getElementById("docManagerModal").style.display = "flex";
}

function saveDocLinks() {
    const name = window.__currentNodeName;
    const node = findItemByName(hierarchyData, name);
    if (!node) return;

    const l1 = document.getElementById("docLink1").value.trim();
    const l2 = document.getElementById("docLink2").value.trim();
    const l3 = document.getElementById("docLink3").value.trim();

    const combined = [l1, l2, l3].filter(x => x).join(";");

    node.documentation = combined;

    closeDocManagerModal();

    const selected = document.querySelector('.tree-item.selected');
    if (selected) selected.querySelector('.item-originalname').click();
}

function closeDocManagerModal() {
    document.getElementById("docManagerModal").style.display = "none";
}

/* --- <script> (body outside template) --- */
function updateImage() {
    const componentImage = document.getElementById("componentImage");
    let componentModel = document.getElementById("componentModel");
    const prevButton = document.getElementById("prevImage");
    const nextButton = document.getElementById("nextImage");
    const zoomControls = document.getElementById("zoomControls");

    let noImageText = document.getElementById("noImageText");
    if (!noImageText) {
        noImageText = document.createElement("div");
        noImageText.id = "noImageText";
        noImageText.textContent = "SEM FIGURA";
        noImageText.style.position = "absolute";
        noImageText.style.top = "50%";
        noImageText.style.left = "50%";
        noImageText.style.transform = "translate(-50%, -50%)";
        noImageText.style.fontSize = "2em";
        noImageText.style.color = "#999";
        noImageText.style.fontWeight = "bold";
        noImageText.style.zIndex = "5";
        noImageText.style.pointerEvents = "none";
        noImageText.style.display = "none";
        document.getElementById("imageContainer").appendChild(noImageText);
    }

    const hasAny = Array.isArray(imageUrls) && imageUrls.length > 0;
    if (!hasAny) {
        // Nothing to show
        if (componentImage) { componentImage.onerror = null; componentImage.src = ""; componentImage.style.display = "none"; }
        if (componentModel) { componentModel.src = ""; componentModel.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "none";
        noImageText.style.display = "block";
        const info = document.getElementById("imageInfo");
        if (info) info.textContent = "0 / 0";
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        return;
    }

    const url = (imageUrls[currentImageIndex] || "").toString().trim();

    // 3D model (.glb/.gltf)
    if (isGlbUrl(url)) {
        if (componentImage) { componentImage.onerror = null; componentImage.src = ""; componentImage.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "none";
        noImageText.style.display = "none";

        componentModel = rebuildComponentModelViewer() || componentModel;

        if (componentModel) {
            componentModel.style.display = "block";
            componentModel.style.pointerEvents = "auto";
            componentModel.setAttribute("camera-controls", "");
            // Force reload even if same URL
            componentModel.src = "";
            setTimeout(() => { componentModel.src = url; }, 30);

            // In case of load error, fall back to "SEM FIGURA"
            const onError = () => {
                console.error("GLB load failed:", url);
                componentModel.style.display = "none";
                noImageText.style.display = "block";
            };
            componentModel.removeEventListener("error", onError);
            componentModel.addEventListener("error", onError, { once: true });
            // Hide "SEM FIGURA" if the model loads successfully
            const onLoad = () => {
                noImageText.style.display = "none";
            };
            componentModel.addEventListener("load", onLoad, { once: true });
        } else {
            // model-viewer not available
            noImageText.style.display = "block";
        }

        updateImageInfo();
    } else {
        // Regular image
        if (componentModel) { componentModel.src = ""; componentModel.style.display = "none"; }
        if (zoomControls) zoomControls.style.display = "block";
        noImageText.style.display = "none";

        if (componentImage) {
            componentImage.style.display = "block";
            componentImage.src = url;
            componentImage.onerror = () => {
                console.error("Image load failed:", url);
                componentImage.style.display = "none";
                noImageText.style.display = "block";
            };
        }
        resetZoom();
        updateImageInfo();
    }

    if (prevButton) prevButton.disabled = currentImageIndex <= 0;
    if (nextButton) nextButton.disabled = currentImageIndex >= imageUrls.length - 1;
}


function bindTreeEditSync() {
    const selectedItem = document.querySelector(".tree-item.selected input");
    if (!selectedItem) return;

    selectedItem.addEventListener("input", function () {
        const firstRow = document.querySelector("#tableContainer table tbody tr");
        if (firstRow) {
            const nameCell = firstRow.querySelector("td");
            if (nameCell) {
                nameCell.textContent = selectedItem.value;
            }
        }
    });
}


/* --- <script> (body outside template) --- */
function toggleTreeEdit(container, enable) {
    container.querySelectorAll(".item-originalname").forEach(label => {
        const parent = label.parentElement;
        if (enable) {
            if (!parent.querySelector("input")) {
                const input = document.createElement("input");
                input.value = label.textContent;
                input.className = "tree-edit-input";
                label.style.display = "none";
                parent.appendChild(input);
            }
        } else {
            const input = parent.querySelector("input");
            if (input) {
                label.textContent = input.value;
                label.style.display = "inline";
                input.remove();
            }
        }
    });
}

function toggleTableEdit(enable) {
    const tableContainer = document.getElementById("tableContainer");
    const rows = tableContainer.querySelectorAll("table tbody tr");

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, colIndex) => {
            if (colIndex === 0) return; // Nome não editável

            if (enable) {
                const input = document.createElement("input");
                input.value = cell.textContent;
                input.className = "tree-edit-input";
                cell.textContent = "";
                cell.appendChild(input);
            } else {
                const input = cell.querySelector("input");
                if (input) {
                    cell.textContent = input.value;
                }
            }
        });
    });
}

/* --- <script> (body outside template) --- */
function handleDocButtonClick() {
    const selectedTreeItem = document.querySelector('.tree-item.selected');
    const docButton = document.getElementById("docButton");

    if (!selectedTreeItem) {
        alert("Por favor, selecione um item na árvore.");
        docButton.style.backgroundColor = "#d3d3d3"; // cinza claro
        return;
    }

    const selectedName = selectedTreeItem.querySelector('.item-originalname').textContent;
    const item = findItemByName(hierarchyData, selectedName);

    if (!item || !item.documentation || item.documentation.trim() === "") {
        alert("Este item não possui documentação associada.");
        docButton.style.backgroundColor = "#d3d3d3"; // cinza claro
        return;
    }

    docButton.style.backgroundColor = ""; // reset – let CSS apply primary blue

    showDocumentation(
        item.description || "",
        item.codigoSap || "",
        item.documentation || "",
        item.originalname || "",
        item.fabricanteFornecedor || "",
        item.referenciaComercial || "",
        item.qtd || ""
    );
}

/* --- <script> (body outside template) --- */
function updateDocButtonColor(item) {
    const docButton = document.getElementById("docButton");
    if (!docButton || !item) return;

    if (!item.documentation || item.documentation.trim() === "") {
        docButton.style.backgroundColor = "#9ca3af"; // gray = no documentation
    } else {
        docButton.style.backgroundColor = ""; // reset – CSS primary blue = has documentation
    }
}

/* --- <script> (body outside template) --- */
function saveEditedJson() {
    const statusBar = document.getElementById("saveStatusBar");
    if (statusBar) {
        statusBar.style.display = "block";
        setTimeout(() => {
            statusBar.style.display = "none";
        }, 2000);
    }

    // Update hierarchyData with edited names from the tree
    document.querySelectorAll('.item-originalname').forEach(span => {
        const parent = span.closest('.tree-item');
        if (!parent) return;

        const input = span.querySelector('input');
        const newText = input ? input.value.trim() : span.textContent.trim();

        // Find the corresponding node in hierarchyData and update
        function updateNode(data) {
            for (const node of data) {
                if (node.originalname === span.dataset.originalname) {
                    node.originalname = newText;
                    node.name = newText;
                    return true;
                }
                if (node.children && updateNode(node.children)) return true;
            }
            return false;
        }

        if (!span.dataset.originalname) {
            span.dataset.originalname = span.textContent.trim();
        }

        updateNode(hierarchyData);
        span.textContent = newText;
        span.dataset.originalname = newText;
    });

    // Optional: alert or console log
    console.log("Hierarchy data updated from UI edits.");

    // Download the updated hierarchyData as JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hierarchyData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "estrutura_editada.json");
    dlAnchorElem.click();
}

/* --- <script> (body outside template) --- */
function findNodeByName(name, nodes = hierarchyData) {
    for (let node of nodes) {
        if (node.originalname === name) return node;
        if (node.children) {
            const found = findNodeByName(name, node.children);
            if (found) return found;
        }
    }
    return null;
}

function toggleTextEdit() {
    if (!isFullEditMode) return;

    const table = document.querySelector('#tableContainer table');
    if (!table) return;

    const isEditing = table.querySelector('input') !== null;

    // normaliza: minúsculas, sem acentos, trim e espaços compactados
    const norm = (s) => (s ?? '')
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    // chaves normalizadas para evitar problemas com "ID"/"Id"/"id"
    const editableColsNorm = ['nome', 'id', 'fornecedor', 'ref. comercial', 'qtd', 'codigo sap'];
    const headerCells = Array.from(table.querySelectorAll('thead th'));
    const headerKeys = headerCells.map(th => norm(th.textContent));

    const selectedTreeItem = document.querySelector('.tree-item.selected');
    const selectedName = selectedTreeItem?.querySelector('.item-originalname')?.textContent.trim();
    const selectedItem = selectedName ? findNodeByName(selectedName) : null;
    if (selectedItem) currentSelectedNode = selectedItem;

    // dados só da 1ª linha (editável)
    const rowsData0 = {};

    Array.from(table.querySelectorAll('tbody tr')).forEach((row, rowIndex) => {
        const isFirstRow = rowIndex === 0;
        Array.from(row.cells).forEach((cell, colIndex) => {
            const key = headerKeys[colIndex];
            if (!editableColsNorm.includes(key)) return;

            if (isEditing) {
                // salvando: volta input -> texto (todas as linhas)
                const input = cell.querySelector('input');
                const newValue = input ? input.value.trim() : cell.textContent.trim();
                if (input) cell.textContent = newValue;
                if (isFirstRow) rowsData0[key] = newValue;
            } else {
                // editando: habilita input só na 1ª linha
                if (isFirstRow) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = cell.textContent.trim();
                    input.style.width = '100%';
                    cell.innerHTML = '';
                    cell.appendChild(input);
                }
            }
        });
    });

    if (isEditing && currentSelectedNode && Object.keys(rowsData0).length) {
        // Nome
        if (rowsData0['nome']) {
            const newName = rowsData0['nome'];
            currentSelectedNode.originalname = newName;
            currentSelectedNode.name = newName;

            const selectedSpan = selectedTreeItem?.querySelector('.item-originalname');
            if (selectedSpan) selectedSpan.textContent = newName;
        }

        // helpers
        const setIfPresent = (prop, val) => {
            if (val != null && String(val).trim() !== '') {
                currentSelectedNode[prop] = String(val).trim();
            }
        };

        setIfPresent('fabricanteFornecedor', rowsData0['fornecedor']);
        setIfPresent('referenciaComercial', rowsData0['ref. comercial']);
        setIfPresent('qtd', rowsData0['qtd']);
        setIfPresent('codigoSap', rowsData0['codigo sap']);

        // ID -> garante persistência onde quer que a tabela leia
        if (rowsData0['id'] != null && String(rowsData0['id']).trim() !== '') {
            const v = String(rowsData0['id']).trim();

            // Nó atual
            currentSelectedNode.idFigura = v;
            currentSelectedNode.id = v;

            // Se sua render lê de "cadastro", sincroniza também
            const cad = currentSelectedNode.cadastro;
            if (cad && typeof cad === 'object') {
                if (Array.isArray(cad)) {
                    // atualiza o primeiro item, se existir (ajuste se precisar outro índice)
                    if (cad.length > 0) {
                        if ('id' in cad[0]) cad[0].id = v;
                        if ('idFigura' in cad[0]) cad[0].idFigura = v;
                    }
                } else {
                    cad.id = v;
                    if ('idFigura' in cad) cad.idFigura = v;
                }
            }
        }

        // re-render
        displayDetails(
            currentSelectedNode.description,
            currentSelectedNode.codigoSap,
            currentSelectedNode.idFigura,
            currentSelectedNode.documentation,
            currentSelectedNode.imageUrl1,
            currentSelectedNode.imageUrl2,
            currentSelectedNode.imageUrl3,
            currentSelectedNode.originalname,
            currentSelectedNode.fabricanteFornecedor,
            currentSelectedNode.referenciaComercial,
            currentSelectedNode.qtd,
            currentSelectedNode.cadastro
        );
    }
}

/* --- <script> (body outside template) --- */
function showImageModal(imageUrl, materialId) {    // === Preencher campos (MaterialId, Texto breve, Texto Longo) usando Material como chave ===
    try {
        const mid = String(materialId).trim();
        let item = null;
        if (Array.isArray(window.jsonData)) {
            item = window.jsonData.find(x => {
                const mat = x && x.hasOwnProperty('Material') ? String(x['Material']).trim() : '';
                return (mat && mat === mid);
            }) || null;
        }
        const idEl    = document.getElementById('modalMaterialId');
        const shortEl = document.getElementById('modalShortText');
        const longEl  = document.getElementById('modalLongText');
        // Preferir valor do JSON; fallback para o argumento materialId
        const idVal    = item && item['Material'] ? String(item['Material']) : mid;
        const shortVal = item && (item['Texto breve de material'] ?? item['Texto Breve'] ?? item['Breve']) || '';
        const longVal  = item && (item['Texto Longo'] ?? item['Texto longo'] ?? item['Descrição Longa'] ?? item['Descricao Longa']) || '';
        if (idEl)    idEl.textContent    = idVal;
        if (shortEl) shortEl.textContent = String(shortVal);
        if (longEl)  longEl.textContent  = String(longVal);
    } catch(e) { /* silencioso */ }
    // === Preencher campos na tabela do modal (chave: Material) ===
    try {
        const mid = String(materialId).trim();
        let item = null;
        if (Array.isArray(window.jsonData)) {
            item = window.jsonData.find(x => {
                const mat = x['Material'] !== undefined ? String(x['Material']).trim() : '';
                return (mat && mat === mid);
            }) || null;
        }
        const sapEl   = document.getElementById('modalSapCode');
        const shortEl = document.getElementById('modalShortText');
        const longEl  = document.getElementById('modalLongText');
        const sapVal   = item ? (item['Material'] ?? '') : ''; // <-- agora mostra 'Material'
        const shortVal = item ? (item['Texto breve de material'] ?? item['Texto Breve'] ?? item['Breve'] ?? '') : '';
        const longVal  = item ? (item['Texto Longo'] ?? item['Texto longo'] ?? item['Descrição Longa'] ?? item['Descricao Longa'] ?? '') : '';
        if (sapEl)   sapEl.textContent   = String(sapVal);
        if (shortEl) shortEl.textContent = String(shortVal);
        if (longEl)  longEl.textContent  = String(longVal);
    } catch(e) { /* silencioso */ }


    try {
        const mid = String(materialId).trim();
        let item = null;
        if (Array.isArray(window.jsonData)) {
            item = window.jsonData.find(x => {
                const mat = x['Material'] !== undefined ? String(x['Material']).trim() : '';
                const sap = x['Código SAP'] !== undefined ? String(x['Código SAP']).trim()
                          : x['Codigo SAP'] !== undefined ? String(x['Codigo SAP']).trim() : '';
                return (mat && mat == mid) || (sap && sap == mid);
            }) || null;
        }
        const sapEl   = document.getElementById('modalSapCode');
        const shortEl = document.getElementById('modalShortText');
        const longEl  = document.getElementById('modalLongText');
        const sapVal   = item ? (item['Código SAP'] ?? item['Codigo SAP'] ?? '') : '';
        const shortVal = item ? (item['Texto breve de material'] ?? item['Texto Breve'] ?? item['Breve'] ?? '') : '';
        const longVal  = item ? (item['Texto Longo'] ?? item['Texto longo'] ?? item['Descrição Longa'] ?? item['Descricao Longa'] ?? '') : '';
        if (sapEl)   sapEl.textContent   = String(sapVal);
        if (shortEl) shortEl.textContent = String(shortVal);
        if (longEl)  longEl.textContent  = String(longVal);
    } catch(e) { /* silencioso */ }

    // === Preencher textos do modal com base no materialId ===
    try {
        const mid = String(materialId).trim();
        let item = null;
        if (Array.isArray(window.jsonData)) {
            item = window.jsonData.find(x => {
                const m1 = (x['Material'] !== undefined) ? String(x['Material']).trim() : '';
                const m2 = (x['Código SAP'] !== undefined) ? String(x['Código SAP']).trim() :
                           (x['Codigo SAP'] !== undefined) ? String(x['Codigo SAP']).trim() : '';
                return (m1 && m1 === mid) || (m2 && m2 === mid);
            }) || null;
        }
        const shortEl = document.getElementById('modalShortText');
        const longEl  = document.getElementById('modalLongText');
        const shortVal = item && (item['Texto breve de material'] ?? item['Texto Breve'] ?? item['Breve']) || '';
        const longVal  = item && (item['Texto Longo'] ?? item['Texto longo'] ?? item['Descrição Longa'] ?? item['Descricao Longa']) || '';
        if (shortEl) shortEl.textContent = String(shortVal);
        if (longEl)  longEl.textContent  = String(longVal);
    } catch(e) { /* silencioso */ }

    if (!imageUrl || imageUrl.toLowerCase() === "none") {
        alert("Imagem não encontrada para este material.");
        return;
    }
    const modal = document.getElementById("materialImageModal");
    const imageElement = document.getElementById("materialImageContent");
    imageElement.src = imageUrl;
    modal.style.display = "flex";
}

/* --- <script> (body outside template) --- */
// 1) Scroll do mouse para zoom no componentImage
document.getElementById('imageContainer').addEventListener('wheel', function (e) {
    // If a 3D model is active, let <model-viewer> handle scroll/gesture (do NOT block).
    const mv = document.getElementById('componentModel');
    const mvVisible = mv && mv.style && mv.style.display !== 'none';
    const mvSrc = mv && (mv.getAttribute('src') || mv.src || '');
    const mvIs3D = mvSrc && (mvSrc.toLowerCase().endsWith('.glb') || mvSrc.toLowerCase().endsWith('.gltf'));
    if (mvVisible && mvIs3D) return;

    e.preventDefault();
    const img = document.getElementById('componentImage');
    if (!img) return;
    let match = img.style.transform.match(/scale\(([^)]+)\)/);
    let scale = match ? parseFloat(match[1]) : 1;
    if (e.deltaY < 0) {
        scale *= 1.1;
    } else {
        scale *= 0.9;
    }
    img.style.transform = `translate(-50%, -50%) scale(${scale})`;
}, { passive: false });

// 2) Enter para filtrar na aba PESQUISA MATERIAL
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const abaPesquisa = document.getElementById('pesquisaMaterial');
        if (abaPesquisa && abaPesquisa.classList.contains('active')) {
            if (typeof filterData === 'function') {
                filterData();
            }
        }
    }
});

// 3) ESC para fechar modal de imagem material
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('materialImageModal');
        if (modal && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});

/* --- <script> (body outside template) --- */
(function() {
  // Fecha o modal com segurança e limpa conteúdos
  window.closeImageModal = function() {
    const modal = document.getElementById('materialImageModal');
    if (!modal) return;
    modal.style.display = 'none';
    // Opcional: limpar imagem e textos para evitar "flash" de conteúdo antigo
    const img = document.getElementById('materialImageContent');
    if (img) img.removeAttribute('src');
    const idEl = document.getElementById('modalMaterialId');
    const sEl = document.getElementById('modalShortText');
    const lEl = document.getElementById('modalLongText');
    if (idEl) idEl.textContent = '';
    if (sEl) sEl.textContent = '';
    if (lEl) lEl.textContent = '';
  };

  // Tecla ESC fecha o modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('materialImageModal');
      if (modal && modal.style.display && modal.style.display !== 'none') {
        closeImageModal();
      }
    }
  });
})();

/* --- <script id="tree-search-script-antigo"> (body outside template) --- */
(function(){
  let treeIndex = [];
  let results = [];
  let resultCursor = -1;
  let lastQuery = "";

  const norm = s => (s||"").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function injectTreeSearchBar(){
    const host = document.getElementById('hierarchyTree');
    if(!host) return;
    if(!document.getElementById('treeSearchBar')){
      const div = document.createElement('div');
      div.id = 'treeSearchBar';
      div.className = 'tree-search-bar';
      div.innerHTML = `
        <input id="treeSearchInput" type="search" placeholder="Buscar (Ctrl+K): Nome, SAP, Fornecedor, Ref." />
        <button id="treeSearchBtn" title="Buscar" aria-label="Buscar">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 10-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"/>
          </svg>
        </button>
        <button id="treeSearchClear" title="Limpar" aria-label="Limpar">×</button>
        <span id="treeSearchCount" class="tree-search-count"></span>
      `;
      host.insertBefore(div, host.firstChild);
      wireSearchEvents();
    }
  }

  function buildTreeSearchIndex(){
    treeIndex = [];
    const items = document.querySelectorAll('#treeContent .tree-item');
    items.forEach(item => {
      const nameSpan = item.querySelector('.item-originalname');
      if(!nameSpan) return;
      const li = item.closest('li');

      const pathNames = [];
      let p = li;
      while(p){
        const nm = p.querySelector(':scope > .tree-item .item-originalname');
        if(nm) pathNames.unshift(nm.textContent.trim());
        p = p.parentElement && p.parentElement.closest ? p.parentElement.closest('li') : null;
      }

      const meta = [item.dataset.sap, item.dataset.ref, item.dataset.forn, item.dataset.desc]
                   .filter(Boolean).join(' ');

      treeIndex.push({
        el: nameSpan,
        li: li,
        name: nameSpan.textContent.trim(),
        pathText: pathNames.join(' > '),
        meta: meta
      });
    });
  }

  function expandAncestors(li){
    let p = li && li.parentElement && li.parentElement.closest ? li.parentElement.closest('li') : null;
    while(p){
      const ul = p.querySelector(':scope > ul');
      const tog = p.querySelector(':scope > .tree-item .toggle-btn');
      if(ul && tog){
        ul.style.display = 'block';
        tog.textContent = '-';
      }
      p = p.parentElement && p.parentElement.closest ? p.parentElement.closest('li') : null;
    }
  }

  function clearHighlights(){
    results = [];
    resultCursor = -1;
    document.querySelectorAll('#treeContent .tree-item').forEach(div=>{
      div.classList.remove('selected');
    });
    document.querySelectorAll('#treeContent .item-originalname').forEach(span=>{
      span.innerHTML = span.textContent.trim();
    });
    setCount('');
  }

  function setCount(txt){
    const c = document.getElementById('treeSearchCount');
    if(c) c.textContent = txt;
  }

  function highlightMatch(span, query){
    const text = span.textContent;
    if(!query){ span.textContent = text; return; }
    try{
      const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&') + ')', 'i');
      span.innerHTML = text.replace(re, '<mark>$1</mark>');
    }catch(e){
      span.textContent = text;
    }
  }

  function runSearch(query){
    clearHighlights();
    const q = norm(query);
    if(!q){ lastQuery=""; return; }
    treeIndex.forEach(entry=>{
      if(norm(entry.name).includes(q) || norm(entry.meta).includes(q)){
        highlightMatch(entry.el, query);
        results.push(entry.el);
      }
    });
    if(results.length){
      resultCursor = 0;
      focusResult(0);
      setCount(results.length + ' encontrado(s)');
    }else{
      setCount('0 encontrado');
    }
    lastQuery = query.trim();
  }

  function scrollIntoTreeCenter(target){
    const container = document.getElementById('treeContent') || document.getElementById('hierarchyTree');
    if(!container || !target) return;
    const crect = container.getBoundingClientRect();
    const trect = target.getBoundingClientRect();
    const delta = (trect.top - crect.top) - (crect.height/2 - trect.height/2);
    container.scrollTop += delta;
  }

  function focusResult(idx){
    results.forEach(el => {
      const cont = el.closest('.tree-item');
      if(cont) cont.classList.remove('selected');
    });
    const el = results[idx];
    if(!el) return;
    const itemDiv = el.closest('.tree-item');
    if(itemDiv){
      expandAncestors(itemDiv.closest('li'));
      const selfUl = itemDiv.closest('li')?.querySelector(':scope > ul');
      const selfTog = itemDiv.querySelector(':scope > .toggle-btn');
      if(selfUl && selfTog){ selfUl.style.display = 'block'; selfTog.textContent = '-'; }

      itemDiv.classList.add('selected');
      if(typeof window.highlightSelected === 'function') window.highlightSelected(itemDiv);
      scrollIntoTreeCenter(itemDiv);

      // Activate node as if clicked by user (only when SISTEMA/EQUIPAMENTO tab is active)
      try {
        var pane = document.getElementById('montagem');
        var isActive = pane && pane.classList && pane.classList.contains('active');
        if(isActive){
          var nameEl = itemDiv.querySelector('.item-originalname');
          if(nameEl){ setTimeout(function(){ nameEl.click(); }, 0); }
        }
      } catch(e){ console.warn('auto-activate search result failed', e); }
}
  }

  function nextResult(dir){
    if(!results.length) return;
    resultCursor = (resultCursor + (dir||1) + results.length) % results.length;
    focusResult(resultCursor);
  }

  function wireSearchEvents(){
    const input = document.getElementById('treeSearchInput');
    const btn   = document.getElementById('treeSearchBtn');
    const clr   = document.getElementById('treeSearchClear');
    if(!input || !btn || !clr) return;

    // Run only on Enter or click; button mirrors Enter behavior
    btn.addEventListener('click', ()=>{
      if(input.value.trim() !== lastQuery){
        runSearch(input.value);
      } else {
        nextResult(+1);
      }
    });

    clr.addEventListener('click', ()=>{
      input.value='';
      clearHighlights();
      lastQuery = "";
      input.focus();
    });

    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        if(input.value.trim() !== lastQuery){
          runSearch(input.value);
        }else{
          nextResult(+1);
        }
      }else if(e.key === 'Enter' && e.shiftKey){
        e.preventDefault();
        nextResult(-1);
      }else if(e.key === 'Escape'){
        clearHighlights();
        lastQuery = "";
      }
    });

    document.addEventListener('keydown', (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  // Hook generateTree to (re)index after render; fallback to DOMContentLoaded
  const _origGenerateTree = window.generateTree;
  window.generateTree = function(){
    if(typeof _origGenerateTree === 'function'){ _origGenerateTree(); }
    injectTreeSearchBar();
    buildTreeSearchIndex();
  };

  runWhenReady( ()=>{
    injectTreeSearchBar();
    buildTreeSearchIndex();
  });
})();

/* --- <script> (body outside template) --- */
// === Image Modal (Gerenciar Imagens) — robust handlers injected ===
(function(){
  // Normalize Google Drive links to a thumbnail URL that loads cross-origin
  window.convertGoogleDriveUrl = window.convertGoogleDriveUrl || function(url){
    if(!url) return "";
    // If already "thumbnail?id=" let it pass (append size if missing)
    const tn = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
    if (tn && tn[1]) {
      return url.includes("&sz=") ? url : (url + "&sz=w800");
    }
    // Standard /file/d/ID/
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
    if (m && m[1]) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w800";
    return url;
  };

  // Open the modal and preload fields from the selected node
  window.triggerImageUpload = function(){
    const selected = document.querySelector(".tree-item.selected");
    if(!selected){
      alert("Selecione um item da árvore para alterar as imagens.");
      return;
    }
    const el = selected.querySelector(".item-originalname");
    const name = (el?.dataset?.originalname || el?.textContent || "").trim();
    if(!name){
      alert("Item inválido.");
      return;
    }
    const node = (typeof hierarchyData !== "undefined") ? findItemByName(hierarchyData, name) : null;
    if(!node){
      alert("Item não encontrado.");
      return;
    }
    const modal = document.getElementById("imageModal");
    if(!modal){
      alert("Modal de imagens não encontrado.");
      return;
    }
    // Fill inputs
    const i1 = document.getElementById("imageLink1");
    const i2 = document.getElementById("imageLink2");
    const i3 = document.getElementById("imageLink3");
    if(i1) i1.value = node.imageUrl1 || "";
    if(i2) i2.value = node.imageUrl2 || "";
    if(i3) i3.value = node.imageUrl3 || "";

    // Keep current context
    window.__currentNodeName = name;
    window.__currentNodeRef  = node;

    modal.style.display = "flex";
  };

  // Close only the #imageModal
  window.closeImageModal = function(){
    const modal = document.getElementById("imageModal");
    if (modal) modal.style.display = "none";
  };

  // Save links back to the node and refresh image preview/details
  window.saveImageLinks = function(){
    const name = window.__currentNodeName;
    let node = window.__currentNodeRef || (name && typeof hierarchyData !== "undefined" ? findItemByName(hierarchyData, name) : null);
    if(!node){
      alert("Selecione um item da árvore para salvar os links de imagem.");
      return;
    }
    const raw1 = (document.getElementById("imageLink1")?.value || "").trim();
    const raw2 = (document.getElementById("imageLink2")?.value || "").trim();
    const raw3 = (document.getElementById("imageLink3")?.value || "").trim();

    node.imageUrl1 = raw1 ? convertGoogleDriveUrl(raw1) : "";
    node.imageUrl2 = raw2 ? convertGoogleDriveUrl(raw2) : "";
    node.imageUrl3 = raw3 ? convertGoogleDriveUrl(raw3) : "";

    // Update gallery/preview if present
    const list = [node.imageUrl1, node.imageUrl2, node.imageUrl3].filter(Boolean);
    window.imageUrls = list;
    window.currentImageIndex = 0;

    const img = document.getElementById("componentImage");
    if (img){
      if (list.length) {
        img.src = list[0];
        img.style.display = "block";
      } else {
        img.removeAttribute("src");
        img.style.display = "none";
      }
    }
    if (typeof window.updateImageInfo === "function") window.updateImageInfo();

    // Re-render details by simulating a click on the selected tree item
    const sel = document.querySelector(".tree-item.selected .item-originalname");
    if (sel) sel.click();

    closeImageModal();
  };

  // ESC to close the modal
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){
      const m = document.getElementById("imageModal");
      if (m && m.style.display && m.style.display !== "none") closeImageModal();
    }
  });
})();

/* --- <script> (body outside template) --- */
// ===== Pesquisa Material & Material Modal key handlers (unified) =====
(function(){
  function isTabActive(id){
    const el = document.getElementById(id);
    return !!(el && el.classList && el.classList.contains('active'));
  }

  // Close ONLY the MaterialImageModal
  window.closeMaterialImageModal = function(){
    const modal = document.getElementById('materialImageModal');
    if(!modal) return;
    modal.style.display = 'none';
    const img  = document.getElementById('materialImageContent');
    const idEl = document.getElementById('modalMaterialId');
    const sEl  = document.getElementById('modalShortText');
    const lEl  = document.getElementById('modalLongText');
    if(img) img.removeAttribute('src');
    if(idEl) idEl.textContent = '';
    if(sEl)  sEl.textContent  = '';
    if(lEl)  lEl.textContent  = '';
  };

  // Enter on fields inside PESQUISA MATERIAL triggers filterData()
  function bindEnterToFilter(){
    var input = document.getElementById('searchInput');
    var depo  = document.getElementById('depositoFilter');
    var cond  = document.getElementById('searchCondition');
    var chk   = document.getElementById('utilizacaoLivreCheckbox');
    [input, depo, cond, chk].forEach(function(el){
      if(!el) return;
      el.addEventListener('keydown', function(e){
        if(e.key === 'Enter' && isTabActive('pesquisaMaterial')){
          e.preventDefault();
          if(typeof window.filterData === 'function'){ window.filterData(); }
        }
      });
    });
  }

  // ESC closes the MaterialImageModal (works for display:flex or block)
  function bindEscToCloseMaterialModal(){
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        var modal = document.getElementById('materialImageModal');
        if(modal && modal.style.display && modal.style.display.toLowerCase() !== 'none'){
          closeMaterialImageModal();
        }
      }
    });
  }

  // Run now (DOM may already be ready) and on DOMContentLoaded
  if(document.readyState !== 'loading'){ bindEnterToFilter(); bindEscToCloseMaterialModal(); }
  runWhenReady( function(){ bindEnterToFilter(); bindEscToCloseMaterialModal(); });
})();

/* --- <script> (body outside template) --- */
/* ===== Fullscreen Viewer (Image / 3D) ===== */
(function(){
  const container = document.getElementById('imageContainer');
  const btn = document.getElementById('fullscreenBtn');
  if(!container || !btn) return;

  function resizeModelViewer(){
    const mv = container.querySelector('model-viewer');
    if(!mv) return;
    const prev = mv.style.display;
    mv.style.display = 'none';
    requestAnimationFrame(()=>{ mv.style.display = prev || ''; });
  }

  btn.addEventListener('click', ()=>{
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(()=>resizeModelViewer());
    } else {
      document.exitFullscreen().then(()=>resizeModelViewer());
    }
  });

  document.addEventListener('fullscreenchange', resizeModelViewer);
  window.addEventListener('resize', ()=>setTimeout(resizeModelViewer, 80));
})();

/* --- <script> (body outside template) --- */
/* ─────────────────────────────────────────────────────────────────────
   1. TOAST NOTIFICATION SYSTEM
   ───────────────────────────────────────────────────────────────────── */
(function(){
  /**
   * showToast(message, type, duration)
   * type: 'info' | 'success' | 'error'
   */
  window.showToast = function(message, type, duration){
    type     = type     || 'info';
    duration = duration || 3200;
    const t = document.createElement('div');
    t.className = 'ebom-toast ebom-toast-' + type;
    t.textContent = message;
    t.onclick = function(){ if(t.parentNode) t.parentNode.removeChild(t); };
    document.body.appendChild(t);
    setTimeout(function(){
      if(t.parentNode) t.parentNode.removeChild(t);
    }, duration);
  };

  /* Replace alert() on import/load actions only (do not suppress all alerts) */
  const _origAlert = window.alert.bind(window);
  window._nativeAlert = _origAlert;

  /* Intercept friendly alerts (file-load feedback) */
  const TOAST_PATTERNS = [
    /JSON carregado com sucesso/i,
    /JSON loaded successfully/i,
    /succesfully loaded/i,
    /Arquivo JSON inválido/i,
    /Invalid JSON/i,
    /Por favor.*selecione.*arquivo JSON/i,
    /Please.*select.*JSON/i,
    /Material search JSON/i,
    /Hierarquia.*carregada/i,
    /carregado com sucesso/i,
    /loaded successfully/i,
  ];

  window.alert = function(msg){
    const s = String(msg);
    for(var i=0; i<TOAST_PATTERNS.length; i++){
      if(TOAST_PATTERNS[i].test(s)){
        var tp = /erro|invalid|inválid|falhou|error|failed/i.test(s) ? 'error' : 'success';
        showToast(s, tp);
        return;
      }
    }
    _origAlert(s);
  };
})();

/* --- <script> (body outside template) --- */
/* ─────────────────────────────────────────────────────────────────────
   2. INTERNATIONALISATION (i18n) — EN / PT
   ───────────────────────────────────────────────────────────────────── */
(function(){
  var TRANSLATIONS = {
    en: {
      /* Tabs */
      tab_montagem:          'HIERARCHY ASSEMBLY',
      tab_pesquisaMaterial:  'MATERIAL SEARCH',
      tab_chat:              'AI ASSISTANT',
      tab_checklistDigital:  'CHECKLIST DIGITAL',
      tab_tools:             '⚙ TOOLS',
      /* Import bars */
      import_bom:      'Load JSON — BOM',
      import_catalog:  'Load JSON — Material Catalog',
      import_btn:      'Import',
      /* Hierarchy detail area */
      details_heading: 'Details',
      export_excel:    'Export Excel',
      edit_mode:       'Edit Mode',
      saving_json:     'Saving JSON file…',
      /* Material Search */
      search_label:     'Search:',
      stock_label:      'Stock:',
      filter_btn:       'Filter',
      export_search:    'Export Excel',
      stock_gt0:        'Stock > 0',
      /* Table headers */
      th_center:     'Center',
      th_material:   'Material',
      th_short_desc: 'Short Description',
      th_long_desc:  'Long Description',
      th_deposit:    'Depot',
      th_qty:        'Quantity',
      /* Tools tab */
      tools_bar_title:     '⚙ Excel → JSON Converters',
      tools_section_header:'Convert Excel spreadsheets directly in the browser — no Python or Colab required.',
      tool_title_hierarchy:'Hierarchy BOM Builder',
      tool_desc_hierarchy: 'Converts an Excel file with Level 1–10 columns into the Hierarchy JSON used by the HIERARCHY ASSEMBLY tab.',
      tool_title_material: 'Material Catalog Builder',
      tool_desc_material:  'Converts an Excel file with material catalog columns into the JSON used by the MATERIAL SEARCH tab.',
      tool_title_checklist:'Checklist Builder',
      tool_desc_checklist: 'Converts an Excel file with task items and CARRO columns into the JSON used by the CHECKLIST DIGITAL tab.',
      required_cols:       'Required columns:',
      convert_btn:         '⬇ Convert & Download JSON',
      /* Language button */
      lang_toggle: 'PT',
    },
    pt: {
      /* Tabs */
      tab_montagem:          'MONTAGEM DE HIERARQUIA',
      tab_pesquisaMaterial:  'PESQUISA DE MATERIAL',
      tab_chat:              'ASSISTENTE IA',
      tab_checklistDigital:  'CHECKLIST DIGITAL',
      tab_tools:             '⚙ FERRAMENTAS',
      /* Import bars */
      import_bom:     'Carregar JSON — BOM',
      import_catalog: 'Carregar JSON — Catálogo de Materiais',
      import_btn:     'Importar',
      /* Hierarchy detail area */
      details_heading: 'Detalhes',
      export_excel:    'Exportar Excel',
      edit_mode:       'Modo Edição',
      saving_json:     'Salvando arquivo JSON…',
      /* Material Search */
      search_label:     'Pesquisa:',
      stock_label:      'Estoque:',
      filter_btn:       'Filtrar',
      export_search:    'Exportar Excel',
      stock_gt0:        'Estoque > 0',
      /* Table headers */
      th_center:     'Centro',
      th_material:   'Material',
      th_short_desc: 'Descrição Curta',
      th_long_desc:  'Descrição Longa',
      th_deposit:    'Depósito',
      th_qty:        'Quantidade',
      /* Tools tab */
      tools_bar_title:     '⚙ Conversores Excel → JSON',
      tools_section_header:'Converta planilhas Excel diretamente no navegador — sem Python ou Colab.',
      tool_title_hierarchy:'Construtor de Hierarquia BOM',
      tool_desc_hierarchy: 'Converte planilha Excel com colunas Level 1–10 para o JSON de hierarquia da aba MONTAGEM DE HIERARQUIA.',
      tool_title_material: 'Construtor de Catálogo de Materiais',
      tool_desc_material:  'Converte planilha Excel de cadastro de materiais para o JSON da aba PESQUISA DE MATERIAL.',
      tool_title_checklist:'Construtor de Checklist',
      tool_desc_checklist: 'Converte planilha Excel com itens e colunas CARRO para o JSON da aba CHECKLIST DIGITAL.',
      required_cols:       'Colunas obrigatórias:',
      convert_btn:         '⬇ Converter e Baixar JSON',
      /* Language button */
      lang_toggle: 'EN',
    }
  };

  var lang = 'en';

  function setText(id, key){
    var el = document.getElementById(id);
    if(el && TRANSLATIONS[lang][key] !== undefined)
      el.textContent = TRANSLATIONS[lang][key];
  }

  function applyTranslations(){
    var T = TRANSLATIONS[lang];

    /* Tab buttons */
    var tabMap = {
      montagem: 'tab_montagem', pesquisaMaterial: 'tab_pesquisaMaterial',
      chat: 'tab_chat', checklistDigital: 'tab_checklistDigital', tools: 'tab_tools'
    };
    document.querySelectorAll('.tab[onclick]').forEach(function(tab){
      var m = (tab.getAttribute('onclick') || '').match(/switchTab\('(\w+)'\)/);
      if(m && tabMap[m[1]]) tab.textContent = T[tabMap[m[1]]];
    });

    /* Import bar titles */
    var bom = document.querySelector('#montagem .tab-import-title');
    if(bom) bom.textContent = T.import_bom;
    var cat = document.querySelector('#pesquisaMaterial .tab-import-title');
    if(cat) cat.textContent = T.import_catalog;

    /* Import buttons (.btn-accent) */
    document.querySelectorAll('.btn-accent').forEach(function(btn){
      btn.textContent = T.import_btn;
    });

    /* Details heading */
    var dh = document.querySelector('#bottomContainer h3');
    if(dh) dh.textContent = T.details_heading;

    /* Export BOM */
    var eb = document.getElementById('exportButton');
    if(eb) eb.textContent = T.export_excel;

    /* Edit Mode button */
    var em = document.getElementById('editModeBtn');
    if(em) em.textContent = T.edit_mode;

    /* Save status bar */
    var sb = document.getElementById('saveStatusBar');
    if(sb) sb.textContent = T.saving_json;

    /* Search label */
    var sl = document.querySelector('label[for="searchInput"]');
    if(sl) sl.textContent = T.search_label;

    /* Stock label */
    var stl = document.querySelector('label[for="depositoFilter"]');
    if(stl) stl.textContent = T.stock_label;

    /* Filter button */
    var fb = document.getElementById('filterButton');
    if(fb) fb.textContent = T.filter_btn;

    /* Export search */
    var es = document.getElementById('exportSearchButton');
    if(es) es.textContent = T.export_search;

    /* Table headers */
    var thKeys = ['th_center','th_material','th_short_desc','th_long_desc','th_deposit','th_qty'];
    document.querySelectorAll('#resultTable thead th').forEach(function(th, i){
      if(thKeys[i]) th.textContent = T[thKeys[i]];
    });

    /* Tools tab */
    setText('tools-bar-title',      'tools_bar_title');
    setText('tools-section-header', 'tools_section_header');
    setText('tool-title-hierarchy', 'tool_title_hierarchy');
    setText('tool-desc-hierarchy',  'tool_desc_hierarchy');
    setText('tool-title-material',  'tool_title_material');
    setText('tool-desc-material',   'tool_desc_material');
    setText('tool-title-checklist', 'tool_title_checklist');
    setText('tool-desc-checklist',  'tool_desc_checklist');
    document.querySelectorAll('[id^="required-cols-label"]').forEach(function(el){
      el.textContent = T.required_cols;
    });
    document.querySelectorAll('[id^="btn-convert-"]').forEach(function(btn){
      btn.textContent = T.convert_btn;
    });

    /* Language toggle button label */
    var lb = document.getElementById('langToggleBtn');
    if(lb) lb.textContent = T.lang_toggle;
  }

  window.toggleLanguage = function(){
    lang = (lang === 'en') ? 'pt' : 'en';
    applyTranslations();
  };

  /* Apply English translations on load */
  runWhenReady( applyTranslations);
})();

/* --- <script> (body outside template) --- */
/* ─────────────────────────────────────────────────────────────────────
   3. EXCEL → JSON CONVERTERS  (uses SheetJS / xlsx.js already loaded)
   ───────────────────────────────────────────────────────────────────── */
(function(){

  /* ── Shared helper: download a string as a .json file ── */
  function downloadJson(content, filename){
    var blob = new Blob([content], {type: 'application/json'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function setStatus(id, msg, cls){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = msg;
    el.className   = 'tool-status' + (cls ? ' ' + cls : '');
  }

  /* ─────────────────────────────────────────────────────────────────
     3a. HIERARCHY BOM BUILDER
     Mirrors the logic of Excel2Json_Hierarchy_builder.ipynb (v. MAIO 2025)
     ───────────────────────────────────────────────────────────────── */
  window.runHierarchyConverter = function(){
    var inp  = document.getElementById('hierarchyExcelInput');
    var sid  = 'hierarchyConverterStatus';
    if(!inp || !inp.files || !inp.files[0]){
      showToast('Please select an Excel file first.', 'error');
      return;
    }
    var file = inp.files[0];
    setStatus(sid, 'Processing…');
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var wb    = XLSX.read(e.target.result, {type:'binary'});
        var ws    = wb.Sheets[wb.SheetNames[0]];
        var rows  = XLSX.utils.sheet_to_json(ws, {defval:''});

        var LEVELS = [];
        for(var i=1; i<=10; i++) LEVELS.push('Level ' + i);

        function transformUrl(url){
          url = String(url||'').trim();
          if(url.indexOf('/file/d/')>-1 && url.indexOf('/view')>-1){
            var id = url.split('/file/d/')[1].split('/')[0];
            return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800';
          }
          return url;
        }

        function toInt(val){
          var s = String(val||'').replace(/,/g,'').trim();
          var n = parseInt(s, 10);
          return isNaN(n) ? 0 : n;
        }

        function calcCadastro(subset){
          var total    = subset.length;
          var nonBlank = subset.filter(function(r){ return String(r['Código SAP']||'').trim() !== ''; }).length;
          var pct      = total > 0 ? ((nonBlank/total)*100).toFixed(1) : '0.0';
          return nonBlank + '/' + total + ' (' + pct + '%)';
        }

        function buildHierarchy(data, levelIdx){
          if(levelIdx >= LEVELS.length) return [];
          var key     = LEVELS[levelIdx];
          var seen    = [];
          var unique  = [];
          data.forEach(function(r){
            var v = String(r[key]||'').trim().toUpperCase();
            if(v && seen.indexOf(v) === -1){ seen.push(v); unique.push(v); }
          });
          return unique.map(function(item){
            var subset = data.filter(function(r){ return String(r[key]||'').trim().toUpperCase() === item; });
            var row    = subset[0];
            var figRaw = String(row['ID. Figura']||'').trim();
            var fig    = (figRaw !== '' && !isNaN(parseFloat(figRaw))) ? parseInt(parseFloat(figRaw)) : null;
            var name   = fig ? (item + ' [' + fig + ']') : item;
            return {
              name:                name,
              originalname:        item,
              idFigura:            fig,
              description:         String(row['Description']||'').trim(),
              fabricanteFornecedor:String(row['Fabricante/Fornecedor']||'').trim(),
              referenciaComercial: String(row['Referência comercial']||'').trim(),
              codigoSap:           toInt(row['Código SAP']),
              qtd:                 toInt(row['Qtd']),
              documentation:       String(row['Documentação']||'').trim(),
              imageUrl1:           transformUrl(row['Image URL1']),
              imageUrl2:           transformUrl(row['Image URL2']),
              imageUrl3:           transformUrl(row['Image URL3']),
              cadastro:            calcCadastro(subset),
              children:            buildHierarchy(subset, levelIdx + 1)
            };
          });
        }

        var hierarchy = buildHierarchy(rows, 0);
        var json      = JSON.stringify(hierarchy, null, 2);
        var outName   = file.name.replace(/\.(xlsx?|xls)$/i, '.json');
        downloadJson(json, outName);
        setStatus(sid, '✓ JSON downloaded: ' + outName, 'ok');
        showToast('Hierarchy JSON ready: ' + outName, 'success');
      } catch(err){
        setStatus(sid, '✗ Error: ' + err.message, 'err');
        showToast('Conversion failed: ' + err.message, 'error', 5000);
        console.error(err);
      }
    };
    reader.onerror = function(){
      setStatus(sid, '✗ Could not read file.', 'err');
    };
    reader.readAsBinaryString(file);
  };

  /* ─────────────────────────────────────────────────────────────────
     3b. MATERIAL CATALOG BUILDER
     Mirrors the logic of BaseCadastro_gen_img.ipynb
     ───────────────────────────────────────────────────────────────── */
  window.runMaterialConverter = function(){
    var inp = document.getElementById('materialExcelInput');
    var sid = 'materialConverterStatus';
    if(!inp || !inp.files || !inp.files[0]){
      showToast('Please select an Excel file first.', 'error');
      return;
    }
    var file = inp.files[0];
    setStatus(sid, 'Processing…');
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var wb   = XLSX.read(e.target.result, {type:'binary'});
        var ws   = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, {defval: null});

        var records = rows.map(function(row){
          /* Depósito: integer string or text, null when absent */
          var dep = row['Depósito'];
          var depStr = null;
          if(dep !== null && dep !== undefined){
            var depNum = parseFloat(String(dep));
            depStr = (!isNaN(depNum) && depNum === Math.floor(depNum))
              ? String(Math.floor(depNum))
              : String(dep);
          }
          /* Utilização livre: float or null */
          var util    = row['Utilização livre'];
          var utilNum = (util !== null && util !== undefined) ? parseFloat(String(util)) : null;

          return {
            'Centro':                String(row['Centro']                   || ''),
            'Material':              String(row['Material']                 || ''),
            'Texto breve de material': String(row['Texto breve de material']|| ''),
            'Texto Longo':           row['Texto Longo'] != null ? String(row['Texto Longo']) : null,
            'Depósito':              depStr,
            'Utilização livre':      (utilNum !== null && !isNaN(utilNum)) ? utilNum : null,
            'Image URL':             null   /* Drive mapping not available in-browser */
          };
        });

        var json    = JSON.stringify(records, null, 4);
        var outName = file.name.replace(/\.(xlsx?|xls)$/i, '.json');
        downloadJson(json, outName);
        setStatus(sid, '✓ JSON downloaded: ' + outName, 'ok');
        showToast('Material catalog JSON ready: ' + outName, 'success');
      } catch(err){
        setStatus(sid, '✗ Error: ' + err.message, 'err');
        showToast('Conversion failed: ' + err.message, 'error', 5000);
        console.error(err);
      }
    };
    reader.onerror = function(){ setStatus(sid, '✗ Could not read file.', 'err'); };
    reader.readAsBinaryString(file);
  };

  /* ─────────────────────────────────────────────────────────────────
     3c. CHECKLIST BUILDER
     Mirrors the logic of FSM_Excel2Json.ipynb (JSON Generator CARRO-aware v2)
     ───────────────────────────────────────────────────────────────── */
  window.runChecklistConverter = function(){
    var inp = document.getElementById('checklistExcelInput');
    var sid = 'checklistConverterStatus';
    if(!inp || !inp.files || !inp.files[0]){
      showToast('Please select an Excel file first.', 'error');
      return;
    }
    var file = inp.files[0];
    setStatus(sid, 'Processing…');
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var wb = XLSX.read(e.target.result, {type:'binary'});

        /* Pick the most relevant sheet (has "Item" or "Sistema" column) */
        var chosenSheet = wb.SheetNames[0];
        for(var si=0; si<wb.SheetNames.length; si++){
          var sn  = wb.SheetNames[si];
          var tmp = XLSX.utils.sheet_to_json(wb.Sheets[sn], {defval:''});
          if(tmp.length && (tmp[0]['Item'] || tmp[0]['Sistema'] || tmp[0]['item'] || tmp[0]['sistema'])){
            chosenSheet = sn;
            break;
          }
        }

        var ws   = wb.Sheets[chosenSheet];
        var rows = XLSX.utils.sheet_to_json(ws, {defval:''});

        /* Detect CARRO columns */
        var headers   = Object.keys(rows[0] || {});
        var carroCols = headers.filter(function(h){ return h.trim().toLowerCase().startsWith('carro'); });

        function norm(s){ return String(s||'').trim(); }
        function slug(s){
          return String(s||'').toLowerCase()
            .replace(/\s+/g,'_').replace(/[^a-z0-9_-]/g,'');
        }
        function first(){ /* first non-empty arg */
          for(var i=0; i<arguments.length; i++){
            var v = norm(arguments[i]);
            if(v) return v;
          }
          return '';
        }

        var sections = {};
        rows.forEach(function(row){
          var itemCode = norm(row['Item'] || row['item'] || row['Código'] || '');
          if(!itemCode) return;

          var sistema    = norm(row['Sistema']    || row['sistema']    || '');
          var subsistema = norm(row['Subsistema'] || row['subsistema'] || '');

          var carros = {};
          carroCols.forEach(function(c){
            carros[c] = String(row[c]||'').trim().toUpperCase() === 'X';
          });

          var itemObj = {
            id:             slug(itemCode + '_' + sistema + '_' + subsistema),
            item_code:      itemCode,
            label:          norm(row['DESCRIÇÃO CURTA']  || row['Descrição Curta']  || row['Descricao Curta']  || ''),
            descricao_longa:norm(row['DESCRIÇÃO LONGA']  || row['Descrição Longa']  || row['Descricao Longa']  || ''),
            referencia_code:norm(row['REFERÊNCIA']       || row['Referencia']       || ''),
            referencia_url: norm(row['HYPERLINK REFERÊNCIA'] || row['Link Referência'] || row['HYPERLINK'] || ''),
            helper:         first(row['ACESSO'], row['FERRAMENTA'], row['MATERIAL']),
            local:          norm(row['Local'] || row['LOCAL'] || row['local'] || ''),
            sistema:        sistema,
            subsistema:     subsistema,
            tipo_atividade: norm(row['TIPO ATIVIDADE'] || row['Tipo Atividade'] || ''),
            acesso:         norm(row['ACESSO']    || ''),
            ferramenta:     norm(row['FERRAMENTA']|| ''),
            material:       norm(row['MATERIAL']  || ''),
            carros:         carros
          };

          var secKey = sistema + '||' + subsistema;
          if(!sections[secKey]){
            var secName = subsistema ? (sistema + ' - ' + subsistema) : (sistema || 'Seção');
            sections[secKey] = {name: secName, items: []};
          }
          sections[secKey].items.push(itemObj);
        });

        var schema = {
          title:        file.name.replace(/\.(xlsx?|xls)$/i,''),
          carro_columns: carroCols,
          sections:     Object.values ? Object.values(sections) : Object.keys(sections).map(function(k){ return sections[k]; })
        };

        var json    = JSON.stringify(schema, null, 2);
        var outName = file.name.replace(/\.(xlsx?|xls)$/i, '.json');
        downloadJson(json, outName);
        setStatus(sid, '✓ JSON downloaded: ' + outName, 'ok');
        showToast('Checklist JSON ready: ' + outName, 'success');
      } catch(err){
        setStatus(sid, '✗ Error: ' + err.message, 'err');
        showToast('Conversion failed: ' + err.message, 'error', 5000);
        console.error(err);
      }
    };
    reader.onerror = function(){ setStatus(sid, '✗ Could not read file.', 'err'); };
    reader.readAsBinaryString(file);
  };

})();

/* --- <script> (body outside template) --- */
/* ─────────────────────────────────────────────────────────────────────
   4. COPYRIGHT PROTECTION & INTEGRITY NOTICE
   ───────────────────────────────────────────────────────────────────── */
(function(){
  /* Log authorship in developer console */
  var style = 'color:#2563eb; font-weight:bold; font-size:14px;';
  console.log('%c© 2025 eBOM Catalog. All rights reserved.\nUnauthorised copying or redistribution is prohibited.', style);

  /* Warn on right-click (discourages casual source viewing, not a hard lock) */
  document.addEventListener('contextmenu', function(e){
    if(e.target.tagName === 'BODY' || e.target.tagName === 'HTML'){
      e.preventDefault();
      showToast('© eBOM Catalog — source viewing disabled.', 'info', 2500);
    }
  });
})();