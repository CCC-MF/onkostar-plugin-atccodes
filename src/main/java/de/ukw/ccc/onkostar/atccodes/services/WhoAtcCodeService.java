/*
 * MIT License
 *
 * Copyright (c) 2022 Comprehensive Cancer Center Mainfranken
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package de.ukw.ccc.onkostar.atccodes.services;

import de.ukw.ccc.onkostar.atccodes.AgentCode;
import de.ukw.ccc.onkostar.atccodes.AtcCode;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Service to query for agent codes based on WHO xml file
 *
 * @author Paul-Christian Volkmer
 * @since 0.1.0
 */
@Service
public class WhoAtcCodeService extends FileBasedAgentCodeService {

    public WhoAtcCodeService(ResourceLoader resourceLoader) {
        super(resourceLoader);
    }

    protected List<AgentCode> parseFile(ResourceLoader resourceLoader) {
        var result = new ArrayList<AgentCode>();
        var filename = getFilePath("atc.xml");
        try {
            var inputStream = resourceLoader.getResource(filename).getInputStream();
            var context = JAXBContext.newInstance(XmlResource.class);
            var xmlResource = (XmlResource) context.createUnmarshaller().unmarshal(inputStream);
            for (var row : xmlResource.data.rows) {
                result.add(new AtcCode(row.code, row.name));
            }
            logger.warn("Found WHO XML file for ATC-Codes.");
            return result;
        } catch (IOException | JAXBException e) {
            logger.warn("Error reading WHO XML file '{}' for ATC-Codes. Proceeding without inserting data", filename);
        }
        return result;
    }

    @XmlRootElement(name = "xml")
    private static class XmlResource {
        @XmlElement(name = "data", namespace = "urn:schemas-microsoft-com:rowset")
        public XmlData data;
    }

    private static class XmlData {
        @XmlElement(name = "row", namespace = "#RowsetSchema")
        public List<XmlRow> rows;
    }

    private static class XmlRow {
        @XmlAttribute(name = "ATCCode")
        public String code;

        @XmlAttribute(name = "Name")
        public String name;
    }
}
