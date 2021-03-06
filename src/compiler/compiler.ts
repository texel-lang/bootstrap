import { parseFile } from "../parser";
import { FunctionDecl, TexelFile } from "../tree";
import { consoleObject, readFileOrDirectory, TexelFileInfo } from "../utils";
import { SymbolTree, SymbolType } from "../utils/SymbolTree";
import { processSymbolsForSource } from "./symbols";
import { VariableNameCheck } from "./VariableNameCheck";

export interface CompileInfo {
   source: TexelFileInfo,
   tree: TexelFile,
}

export function compile(compilePath: string) {
   const files = readFileOrDirectory(compilePath);
   consoleObject(files);

   const sources: CompileInfo[] = files.map(it => ({
      source: it,
      tree: parseFile(it.filePath, it.contents),
   }));

   const rootSymbol = new SymbolTree(SymbolType.UNKNOWN, "", [], undefined);
   sources.forEach(it => {
      const symbol = mapFile(compilePath, rootSymbol, it);
      processSymbolsForSource(symbol);

      const funcs = symbol.queryForSymbolType(SymbolType.FUNCTION);
      funcs.forEach(it => {
         const variableNameCheck = new VariableNameCheck(symbol, it as FunctionDecl);
         variableNameCheck.check();
      });
   });

   rootSymbol.debugSymbolNameStructure();
   consoleObject(sources[0].tree, 32);
}

function mapFile(compilePath: string, rootSymbol: SymbolTree, file: CompileInfo): SymbolTree {
   let path = file.source.filePath.substr(compilePath.length); // Remove common path parts
   path = path.substring(0, path.length - 4); // Remove .txl extension

   const pathParts = path.split("/")
                         .filter(it => it.trim().length > 0)
                         .map(it => it.trim());

   return rootSymbol.addValueToPath(pathParts, SymbolType.FILE, file.tree);
}
