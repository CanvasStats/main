import { Link } from "../models/helpers.model";
import { router } from "../router";

export function getBlockStructure(block: any) {
    const sectionChildren: any[] = [];
    if (block.title) {
        sectionChildren.push({ elem: 'h3', attr: 'class', attrVal: 'center', txtNode: block.title });
    }

    switch (block.type) {
        case 'standard':
            const paragraphParts = block.content.map((part: string | Link) => {
                if (typeof part === 'string') {
                    return { elem: 'span', txtNode: part };
                }
                if (part.external) {
                    return {
                        elem: 'a',
                        attr: 'href',
                        attrVal: part.url || '#',
                        txtNode: part.linkText,
                        attributes: { target: '_blank', rel: 'noopener noreferrer' }
                    };
                } else {
                    return {
                        elem: 'a',
                        attr: 'class',
                        attrVal: `clickable-text ${part.classes || ''}`,
                        txtNode: part.linkText,
                        onClick: (e: Event) => {
                            e.preventDefault();
                            router.navigateTo(part.page);
                        }
                    };
                }
            });

            sectionChildren.push({ elem: 'p', attr: 'class', attrVal: 'text' }, paragraphParts);
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
                        txtNode: item.key,
                        onClick: () => {
                            router.navigateTo(`/users/${item.key}`, false);
                        }
                    },
                    {
                        elem: 'span',
                        txtNode: `: ${item.value}`
                    }
                ]);
            });

            sectionChildren.push(
                { elem: 'ul', attr: 'class', attrVal: 'top-users' },
                listItems
            );
            break;

        case 'button-group':
            console.log("Found button group")
            const buttonNodes = block.buttons.map((btn: Link) => ({
                elem: 'button',
                attr: 'class',
                attrVal: `btn ${btn.classes}`,
                txtNode: btn.linkText,
                onClick: () => {
                    if (btn.queryParams) {
                        const urlParams = btn.queryParams as Record<string, string | number | boolean>;
                        router.navigateTo(btn.page, false, urlParams);
                    } else {
                        router.navigateTo(btn.page)
                    }

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

            const rawRoute = item.to || (item.elem === 'a' && item.attributes?.href ? item.attributes.href : null);
            const isExternal = rawRoute && (rawRoute.startsWith('http') || rawRoute.startsWith('mailto:'));

            if (rawRoute && !isExternal) {
                el.addEventListener('click', (e: MouseEvent) => {
                    e.preventDefault();
                    router.navigateTo(rawRoute);
                });
            }

            parent.appendChild(el);
            lastElement = el;
        }
    }
}