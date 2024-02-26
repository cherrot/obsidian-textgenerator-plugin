import React, { useEffect, useId, useState } from "react";
import useGlobal from "../context/global";
import clsx from "clsx";
import Input from "../settings/components/input";
import JSON5 from "json5"
import { IconDatabaseImport, IconFileUpload, IconPackageExport, IconPackageImport, IconRestore } from "@tabler/icons-react";
import { currentDate, extractJsonFromText, getCurrentTime } from "#/utils";
import SettingItem from "../settings/components/item";
export default function ExportImportHandler(props: { getConfig: () => any, id: string, onImport: (data: any) => Promise<void> }) {
    const global = useGlobal();
    const backupsDatasetId = useId();


    const [backups, setBackups] = useState<string[]>([]);
    const [selectedBackup, setSelectedBackup] = useState("");
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState("");

    const backupsDirectory = global.plugin.getTextGenPath(`configs/${props.id}`);

    useEffect(() => {
        (async () => {
            if (!await app.vault.adapter.exists(backupsDirectory)) return setBackups([]);
            const list = await app.vault.adapter.list(backupsDirectory);
            setBackups(list.files.map(f => f.substring(backupsDirectory.length + 1)));
        })()
    }, [global.trg, backupsDirectory]);

    const exportButtonDisabled = !selectedBackup?.length || !backups.includes(selectedBackup)


    return <>
        <datalist id={backupsDatasetId}>
            {[...backups].map(bu => <option key={bu} value={bu} />)}
        </datalist>

        {/* <SettingItem
            name="Profiles"
            description="Select Config file to be used"
        >
            <Input
                value={selectedBackup}
                datalistId={backupsDatasetId}
                placeholder="config.json.md"
                setValue={async (value) => {
                    setSelectedBackup(value);
                }}
            />
        </SettingItem> */}
        <div className="plug-tg-flex plug-tg-w-full plug-tg-justify-between plug-tg-items-center">
            <div>
                {/* <Input type="checkbox" value={false} setValue={() => { }} /> */}
            </div>
            <div className="plug-tg-flex plug-tg-gap-2">

                {/* <button
                    className={clsx({
                        "plug-tg-btn-disabled plug-tg-opacity-70": exportButtonDisabled,
                        "plug-tg-cursor-pointer": !exportButtonDisabled,
                    })}
                    disabled={importing || exportButtonDisabled}

                    onClick={async () => {
                        setError("");
                        setImporting(true);
                        try {
                            const path = (`${backupsDirectory}/${selectedBackup}`)
                            const file = await global.plugin.app.vault.getAbstractFileByPath(path);
                            if (!file) return setError(`file ${path} not found`)
                            const txt = await global.plugin.app.vault.read(file as any);
                            const newData = extractJsonFromText(txt);

                            await props.onImport(newData)
                        } catch (err) {
                            setError(err?.message || err)
                        }
                        setImporting(false);
                    }}
                ><IconDatabaseImport /></button> */}
                <button

                    onClick={async () => {
                        setError("");
                        setExporting(true);
                        try {

                            await global.plugin.app.vault.adapter.mkdir(backupsDirectory);

                            const config = { ...await props.getConfig() };
                            delete config.api_key;
                            const configAsString = `\`\`\`JSON
${JSON5.stringify(config, null, 2)}
\`\`\``;

                            let fileName = `config_${currentDate()}${getCurrentTime()}.json.md`;

                            // use the provided name if it doesn't exists already (if it exists it could just be the user selecting one of his configs)
                            if (selectedBackup?.length && !backups.includes(selectedBackup)) fileName = selectedBackup + (selectedBackup.endsWith(".json.md") ? "" : ".json.md")

                            const newPath = `${backupsDirectory}/${fileName}`;

                            await global.plugin.app.vault.adapter.write(newPath, configAsString)
                        } catch (err) {
                            setError(err?.message || err)
                        }
                        setExporting(false);
                        global.triggerReload();
                    }}
                    className={clsx("plug-tg-tooltip plug-tg-tooltip-top", {
                        "plug-tg-btn-disabled plug-tg-loading": exporting
                    })}
                    data-tip="Export Profile"
                    disabled={exporting}
                ><IconPackageExport /></button>
                <button
                    className={clsx("plug-tg-tooltip plug-tg-tooltip-top")}
                    onClick={async () => {
                        const content = await selectJSONMDFile();
                        const r = content.trimStart().trimEnd().split("```JSON");
                        r.shift();
                        const r2 = r.join("```JSON").split("```");
                        r2.pop();

                        const jsonContent = JSON5.parse(r2.join("```"));
                        props.onImport(jsonContent)
                    }}
                    data-tip="Import Profile"
                >
                    <IconFileUpload />
                </button>
            </div>
        </div>

        <div>
            {error}
        </div>
    </>
}

function selectJSONMDFile(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json.md';

        input.onchange = (event) => {
            // @ts-ignore
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result as string);
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsText(file);
        };

        input.click();
    });
}