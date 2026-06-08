import { Link } from "../models";
import { navigateTo } from "./navigate";

export function getBlockStructure(block: any, year: number) {
    const sectionChildren: any[] = [];
    if (block.title) {
        sectionChildren.push({ elem: 'h3', attr: 'class', attrVal: 'center', txtNode: block.title });
    }

    switch (block.type) {
        case 'standard':
            block.content.forEach((paragraph: string | (string | Link)[]) => {
                if (typeof paragraph === 'string') {
                    sectionChildren.push({ elem: 'p', attr: 'class', attrVal: 'text', txtNode: paragraph });
                } else {
                    const paragraphParts = paragraph.map(part => {
                        if (typeof part === 'string') {
                            return { elem: 'span', txtNode: part };
                        }
                        if (part.external) {
                            return {
                                elem: 'a',
                                attr: 'href',
                                attrVal: part.url || '#',
                                txtNode: part.linkText,
                            };
                        } else {
                            return {
                                elem: 'a',
                                attr: 'class',
                                attrVal: `clickable-text ${part.classes}`,
                                txtNode: part.linkText,
                                onClick: (e: Event) => {
                                    e.preventDefault();
                                    navigateTo(part.page, { params: part.queryParams });
                                }
                            };
                        }
                    });
                    sectionChildren.push({ elem: 'p', attr: 'class', attrVal: 'text' }, paragraphParts);
                }
            });
            break;

        case 'color-grid':
            const colorSpans = block.data.map((c: any) => ({
                elem: 'span',
                attr: 'class',
                attrVal: c.class,
                txtNode: `${c.label}: ${c.count}`
            }));
            sectionChildren.push({ elem: 'div', attr: 'class', attrVal: 'colors-wrapper clickable' }, colorSpans);
            break;

        case 'graph':
            sectionChildren.push({ elem: 'div', attr: 'class', attrVal: 'center' }, [
                { elem: 'a', attr: 'href', attrVal: block.imageUrl },
                [{ elem: 'img', attr: 'class', attrVal: 'graph', src: block.imageUrl }]
            ]);
            break;

        case 'list':
            const listItems: any[] = [];

            block.items.forEach((item: any) => {
                listItems.push({ elem: 'li' });
                listItems.push([
                    {
                        elem: 'a',
                        attr: 'class',
                        attrVal: 'clickable-text',
                        txtNode: item.contentKey,
                        onClick: () => {
                            navigateTo("/users/user", { params: { username: item.contentKey, year: year } });
                        }
                    },
                    {
                        elem: 'span',
                        txtNode: `: ${item.contentValue}`
                    }
                ]);
            });

            sectionChildren.push(
                { elem: 'ul', attr: 'class', attrVal: 'top-users' },
                listItems
            );
            break;

        case 'button-group':
            const buttonNodes = block.buttons.map((btn: Link) => ({
                elem: 'button',
                attr: 'class',
                attrVal: `btn ${btn.classes}`,
                txtNode: btn.linkText,
                onClick: () => {
                    navigateTo(btn.page, { params: btn.queryParams });
                }
            }));

            sectionChildren.push(
                { elem: 'div', attr: 'class', attrVal: 'btn-wrapper' },
                buttonNodes
            );
            break;

    }

    return [
        { elem: 'app-stat-block' },
        [
            { elem: 'article', attr: 'class', attrVal: block.layout },
            [
                block.icon ? { elem: 'div', attr: 'class', attrVal: 'icon' } : null,
                block.icon ? [{ elem: 'span', attr: 'class', attrVal: 'material-symbols-outlined icon', txtNode: block.icon.trim() }] : null,
                { elem: 'section' },
                sectionChildren
            ].filter(Boolean)
        ]
    ];
}

export function renderTree(structure: any[], parent: HTMLElement) {
    let lastElement: HTMLElement | null = null;

    for (const item of structure) {
        if (Array.isArray(item)) {
            if (lastElement) renderTree(item, lastElement);
        } else {
            const el = document.createElement(item.elem);
            if (item.attributes) {
                Object.entries(item.attributes).forEach(([key, value]) => {
                    el.setAttribute(key, value as string);
                });
            }
            if (item.attr) el.setAttribute(item.attr, item.attrVal);
            if (item.src) el.setAttribute('src', item.src);
            if (item.txtNode) el.textContent = item.txtNode;

            if (item.onClick) {
                el.onclick = item.onClick;
            }

            parent.appendChild(el);
            lastElement = el;
        }
    }
}